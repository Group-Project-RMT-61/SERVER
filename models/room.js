'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Room.hasMany(models.Message, { foreignKey: 'roomId', as: 'messages' });
      Room.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      Room.belongsToMany(models.User, { through: models.UserRoom, as: 'members' });
    }
  }
  Room.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Room name is required"
        },
        notEmpty: {
          msg: "Room name cannot be empty"
        },
        len: {
          args: [1, 50],
          msg: "Room name must be between 1 and 50 characters long"
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Room',
  });
  return Room;
};