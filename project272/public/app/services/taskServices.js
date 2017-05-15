//Rahil Modi
angular.module('taskServices', [])
.factory('Jobs', function($http) {
    var jobFactory = {}; // Create the factory object

    // Function to post the task
    jobFactory.createPost = (taskDetails) => {
        console.log('inside Jobs post service');
        console.log(taskDetails);
        return $http.post('/api/post/', taskDetails);
    };

    // Get all the users from database
    jobFactory.getPosts = ()=>{
        console.log('getPosts');
        return $http.get('/api/posts/');
    };

    // Get Post object
    jobFactory.getPost = function(taskId) {
        console.log(taskId);
        return $http.get('/api/posts/'+taskId);
    };

    jobFactory.getPostByCategory = function(taskCategory) {
        console.log(taskCategory);
        return $http.get('/api/posts/'+taskCategory);
    };

    jobFactory.getPostByCity = (city)=>{
        console.log(city);
        return $http.get('/api/posts/'+city);
    }

    jobFactory.getPostByStatus = (status)=>{
        console.log(status);
        return $http.get('/api/posts/'+city);
    }

    // Edit a Post
    jobFactory.editPost = function(id) {
        return $http.put('/api/posts/'+ id);
    };

    // Update the post
    jobFactory.updateJob = (updatedData)=>{
        return $http.put('/api/posts/taskId/', updatedData);
    };

    //add comments
    jobFactory.addComment = (obj)=>{
        console.log(obj);
        return $http.post('/api/posts/taskId/comments',obj);
    }

    jobFactory.getComments = (obj)=>{
        console.log(obj);
    }

    return jobFactory; // Return jobFactory object
});
