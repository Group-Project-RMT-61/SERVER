'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Message.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Message.belongsTo(models.Room, { foreignKey: 'roomId', as: 'room' });
    }
  }
  Message.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Message content is required"
        },
        notEmpty: {
          msg: "Message content cannot be empty"
        },
        len: {
          args: [1, 5000],
          msg: "Message content must be between 1 and 5000 characters"
        }
      }
    },
    type: {
      type: DataTypes.ENUM('text', 'image'),
      defaultValue: 'text',
      allowNull: false,
      validate: {
        notNull: {
          msg: "Message type is required"
        },
        notEmpty: {
          msg: "Message type cannot be empty"
        },
        isIn: {
          args: [['text', 'image']],
          msg: "Message type must be either 'text' or 'image'"
        }
      }
    },
    isAI: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
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
    }
  }, {
    sequelize,
    modelName: 'Message',
  });
  return Message;
};