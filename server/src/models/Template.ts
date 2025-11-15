import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  name: { type: String, required: true },
  elements: { type: Object, required: true },
  canvasSize: { type: Object, required: true },
  canvasBg: { type: String, required: true },
  thumbnail: { type: String, required: true }, // data URL
  isPublic: { type: Boolean, default: false, index: true },
  ownerName: { type: String },
  ownerAvatar: { type: String },
}, { timestamps: true });

export type TemplateDoc = mongoose.InferSchemaType<typeof TemplateSchema> & { _id: mongoose.Types.ObjectId };
export const Template = mongoose.model('Template', TemplateSchema);
