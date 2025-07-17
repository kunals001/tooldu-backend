import mongoose from "mongoose";

const convertImagePostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    keyword: {
      type: String,
      required: true,
    },

    mainPartHeadOne: {
      title: {
        type: String,
      },

      description: {
        type: String,
      },
    },

    mainPartHeadTwo: {
      title: {
        type: String,
      },

      description: {
        type: String,
      },
    },

    bottomPart:{
        type:String,
        required:true
    }
  },
  { timestamps: true }
);

const ConvertImagePost = mongoose.model(
  "ConvertImagePost",
  convertImagePostSchema
);

export default ConvertImagePost;
