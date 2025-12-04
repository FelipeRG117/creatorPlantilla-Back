import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String }
  },
  { timestamps: true }
);

export const coursesModel = mongoose.model("course", CourseSchema);
