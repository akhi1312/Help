var mongoose = require('mongoose'); // Import Mongoose Package
var Schema = mongoose.Schema; // Assign Mongoose Schema function to variable

var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);

var taskSchema = new Schema(
    {
        title:  {type:String, required:true},
        posted_by: {type:String, required:true},
        description:  {type:String, required:true},
        comments: [{ body: String, date: Date, commented_by: String }],
        created_at: { type: Date, required:true},
        posted_at: {
                    location : String,
                    latitude : String,
                    longitude : String
                    },
        status : {type:String, default:'available'},
        accepted_by:  {type:String, default:'none'},
        updated_on: {type: Date},
        taskCateogry: {type:String,required:false},
        dateOfTask: {type: String, required:false}
    }
);
taskSchema.plugin(autoIncrement.plugin,{model:'Task',field:'taskId',startAt:1,
	incrementBy:1});

module.exports = mongoose.model('Task', taskSchema);
