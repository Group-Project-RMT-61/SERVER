'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserRoom extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UserRoom.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "User ID is required"
        },
        notEmpty: {
          msg: "User ID cannot be empty"
        }
      },
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Room ID is required"
        },
        notEmpty: {
          msg: "Room ID cannot be empty"
        }
      },
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Joined date is required"
        },
        notEmpty: {
          msg: "Joined date cannot be empty"
        }
      }
    }
  }, {
    sequelize,
    modelName: 'UserRoom',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'roomId'],
        name: 'unique_user_room'
      }
    ],
    validate: {
      uniqueUserRoom() {
        // This will be handled by the unique index constraint
        // The error message will be customized in error handling middleware
      }
    }
  });
  return UserRoom;
};