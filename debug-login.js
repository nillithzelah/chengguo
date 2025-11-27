const { testConnection, sequelize } = require('./config/database');
const defineUserModel = require('./models/User');

async function debugLogin() {
  try {
    console.log('Testing database connection...');
    const connected = await testConnection();
    console.log('Connected:', connected);

    if (connected) {
      const User = defineUserModel(sequelize);
      console.log('User model defined');

      // Test the findByUsername method directly
      console.log('Testing User.findByUsername...');
      const user = await User.findByUsername('nillithzelah');
      console.log('User found by findByUsername:', user ? user.username : 'NOT FOUND');

      // Test raw query
      console.log('Testing raw query...');
      const rawUser = await sequelize.query('SELECT * FROM users WHERE username = ? AND is_active = 1', {
        replacements: ['nillithzelah'],
        type: sequelize.QueryTypes.SELECT
      });
      console.log('Raw query result:', rawUser.length > 0 ? rawUser[0].username : 'NOT FOUND');

      // Test findOne directly
      console.log('Testing User.findOne...');
      const directUser = await User.findOne({
        where: { username: 'nillithzelah', is_active: true }
      });
      console.log('Direct findOne result:', directUser ? directUser.username : 'NOT FOUND');

      if (user) {
        console.log('User data:', {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          is_active: user.is_active
        });

        // Try different passwords
        const passwordsToTest = ['Admin123!', 'nillithzelah', '123456', 'password', 'admin123'];
        for (const pwd of passwordsToTest) {
          const isValid = await user.validatePassword(pwd);
          console.log(`Password '${pwd}' valid:`, isValid);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

debugLogin();