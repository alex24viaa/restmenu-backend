// models/Task.js
const { Schema, model, Types } = require('mongoose');

// Схема для лога истории
const ActivityLogSchema = new Schema({
    user: { type: Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, 
    field: { type: String }, 
    oldValue: { type: String },
    newValue: { type: String },
    timestamp: { type: Date, default: Date.now }
});

// Схема для элементов чек-листа с поддержкой вложенности
const ChecklistItemSchema = new Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    children: [this] // 'this' позволяет схеме ссылаться на саму себя для вложенности
});

const TaskSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, required: true },
    project: { type: Types.ObjectId, ref: 'Project', required: true },
    assignee: { type: Types.ObjectId, ref: 'User' },
    priority: {
        type: Number,
        default: 5,
        min: 1,
        max: 10
    },
    
    // Новые поля
    checklist: [ChecklistItemSchema],
    activityLog: [ActivityLogSchema]

}, { timestamps: true }); // timestamps: true автоматически добавит createdAt и updatedAt

module.exports = model('Task', TaskSchema);