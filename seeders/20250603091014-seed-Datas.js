'use strict';

const { hashPassword } = require('../helpers/bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, create a default user to be the creator of rooms
    await queryInterface.bulkInsert('Users', [{
      username: 'admin',
      email: 'admin@example.com',
      password: hashPassword('hashedpassword123'), // In real app, this should be properly hashed
      avatar: null,
      status: 'offline',
      lastSeen: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    // Define default rooms
    const defaultRooms = [
      { name: 'General', description: 'General discussion', isPrivate: false },
      { name: 'Random', description: 'Random chat', isPrivate: false },
      { name: 'Tech Talk', description: 'Technology discussions', isPrivate: false },
    ];

    const rooms = [];

    for (const room of defaultRooms) {
      rooms.push({
        name: room.name,
        description: room.description,
        isPrivate: room.isPrivate,
        createdBy: 1, // This will be the ID of the admin user (auto-incremented to 1)
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Rooms', rooms, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Rooms', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
