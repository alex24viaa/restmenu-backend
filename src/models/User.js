const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  login: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true 
  },
  password: {
    type: String,
    // ИЗМЕНЕНО: Пароль больше не является обязательным при создании
    required: false, 
    minlength: 6
  }
});

// Этот хук будет работать так же, как и раньше, и хешировать пароль, только когда он есть
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;