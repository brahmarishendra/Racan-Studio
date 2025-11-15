import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  name: { type: String, index: true, required: true },
  data: { type: Object, required: true },
}, { timestamps: true });

ProjectSchema.index({ userId: 1, name: 1 }, { unique: true });

export type ProjectDoc = mongoose.InferSchemaType<typeof ProjectSchema> & { _id: mongoose.Types.ObjectId };
export const Project = mongoose.model('Project', ProjectSchema);
