const { testConnection, sequelize } = require('./config/database');
const defineUserModel = require('./models/User');

async function test() {
  try {
    console.log('Testing database connection...');
    const connected = await testConnection();
    console.log('Connected:', connected);

    if (connected) {
      const User = defineUserModel(sequelize);
      console.log('User model defined');

      const user = await User.findByUsername('admin');
      console.log('User found:', user ? user.username : 'NOT FOUND');

      if (user) {
        console.log('User data:', {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          is_active: user.is_active
        });

        const isValid = await user.validatePassword('Admin123!');
        console.log('Password valid:', isValid);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

test();