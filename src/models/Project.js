const { Schema, model, Types } = require('mongoose');

const projectSchema = new Schema({
    name: { type: String, required: true },
    owner: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    members: [{ type: Types.ObjectId, ref: 'User', index: true }],
    
    // НОВЫЕ ПОЛЯ: Настройки доски для каждого проекта
    statuses: {
        type: [{
            _id: { type: String, required: true },
            name: { type: String, required: true },
        }],
        default: [
            { _id: 's1', name: 'К выполнению' },
            { _id: 's2', name: 'В работе' },
            { _id: 's3', name: 'На проверке' },
            { _id: 's4', name: 'Готово' },
        ]
    },
    columns: {
        type: [{
            _id: { type: String, required: true },
            name: { type: String, required: true },
            statusIds: [{ type: String }] // Здесь будут храниться _id статусов
        }],
        default: [
            { _id: 'c1', name: 'To Do', statusIds: ['s1'] },
            { _id: 'c2', name: 'In Progress', statusIds: ['s2', 's3'] },
            { _id: 'c3', name: 'Done', statusIds: ['s4'] },
        ]
    }
}, { timestamps: true });

module.exports = model('Project', projectSchema);