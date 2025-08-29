const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log(' MongoDB connection error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  createdAt: { type: Date, default: Date.now }
});

// Task Schema
const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
  taskType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Time Log Schema
const TimeLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loginTime: { type: Date, required: true },
  logoutTime: { type: Date },
  date: { type: String, required: true }, // YYYY-MM-DD format
  totalHours: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'logged_out'], default: 'active' }
});

// Models
const User = mongoose.model('User', UserSchema);
const Task = mongoose.model('Task', TaskSchema);
const TimeLog = mongoose.model('TimeLog', TimeLogSchema);

// JWT Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ========================
// AUTH ROUTES
// ========================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'employee'
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Log login time
    const today = new Date().toISOString().split('T')[0];
    const existingLog = await TimeLog.findOne({ 
      user: user._id, 
      date: today,
      status: 'active'
    });

    if (!existingLog) {
      const timeLog = new TimeLog({
        user: user._id,
        loginTime: new Date(),
        date: today
      });
      await timeLog.save();
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Logout
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const timeLog = await TimeLog.findOne({ 
      user: req.user.userId, 
      date: today,
      status: 'active'
    });

    if (timeLog) {
      timeLog.logoutTime = new Date();
      timeLog.status = 'logged_out';
      timeLog.totalHours = (timeLog.logoutTime - timeLog.loginTime) / (1000 * 60 * 60);
      await timeLog.save();
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========================
// USER ROUTES
// ========================

// Get all employees (admin only)
app.get('/api/users/employees', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========================
// TASK ROUTES
// ========================

// Create task (admin only)
app.post('/api/tasks', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      assignedBy: req.user.userId
    });
    await task.save();
    await task.populate('assignedTo assignedBy', 'name email');
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tasks
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    let query = {};
    
    // If employee, only show their tasks
    if (req.user.role === 'employee') {
      query.assignedTo = req.user.userId;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo assignedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update task
app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('assignedTo assignedBy', 'name email');

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete task (admin only)
app.delete('/api/tasks/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========================
// DASHBOARD STATS
// ========================

app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const totalUsers = await User.countDocuments({ role: 'employee' });
      const totalTasks = await Task.countDocuments();
      const completedTasks = await Task.countDocuments({ status: 'Completed' });
      const pendingTasks = await Task.countDocuments({ 
        status: { $in: ['Not Started', 'In Progress'] } 
      });

      res.json({
        totalUsers,
        totalTasks,
        completedTasks,
        pendingTasks
      });
    } else {
      const myTasks = await Task.countDocuments({ assignedTo: req.user.userId });
      const completedTasks = await Task.countDocuments({ 
        assignedTo: req.user.userId, 
        status: 'Completed' 
      });
      const pendingTasks = await Task.countDocuments({ 
        assignedTo: req.user.userId,
        status: { $in: ['Not Started', 'In Progress'] } 
      });

      res.json({
        myTasks,
        completedTasks,
        pendingTasks
      });
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ========================
// TIME LOG ROUTES
// ========================

app.get('/api/timelogs', authMiddleware, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'employee') {
      query.user = req.user.userId;
    }

    const timeLogs = await TimeLog.find(query)
      .populate('user', 'name email')
      .sort({ date: -1 });
    
    res.json(timeLogs);
  } catch (error) {
    console.error('Get time logs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}/api/test`);
});