'use strict';
const {
  Model
} = require('sequelize');
const { hashPassword } = require('../helpers/bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Message, { foreignKey: 'userId', as: 'messages' });
      User.hasMany(models.Room, { foreignKey: 'createdBy', as: 'createdRooms' });
      User.belongsToMany(models.Room, {
        through: models.UserRoom,
        as: 'rooms',
        foreignKey: 'userId',
        otherKey: 'roomId'
      });
    }
  }
  User.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: "Username already exists. Please choose a different username."
      },
      validate: {
        notNull: {
          msg: "Username is required"
        },
        notEmpty: {
          msg: "Username cannot be empty"
        },
        len: {
          args: [3, 20],
          msg: "Username must be between 3 and 20 characters long"
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: "Email address already exists. Please use a different email."
      },
      validate: {
        notNull: {
          msg: "Email is required"
        },
        notEmpty: {
          msg: "Email cannot be empty"
        },
        isEmail: {
          msg: "Please enter a valid email address"
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Password is required"
        },
        notEmpty: {
          msg: "Password cannot be empty"
        },
        len: {
          args: [6, 255],
          msg: "Password must be at least 6 characters long"
        }
      }
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('online', 'offline'),
      defaultValue: 'offline'
    },
    lastSeen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: (user) => {
        user.password = hashPassword(user.password);
      },
    }
  });
  return User;
};