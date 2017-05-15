angular.module('mainController', ['authServices', 'userServices','taskServices']) //Rahil Modi

.factory('socket', ['$rootScope', function($rootScope) {
  var socket = io.connect();
  console.log('starting socket');
  return {
    on: function(eventName, callback){
      socket.on(eventName, callback);
    },
    emit: function(eventName, data) {
      socket.emit(eventName, data);
    }
  };
}])
// Controller: mainCtrl is used to handle login and main index functions (stuff that should run on every page) //Rahil Modi
.controller('mainCtrl',function(Auth, $timeout, $location, $rootScope, $window, $interval, User, AuthToken, $scope, Jobs,socket) {
    console.log('2');
    var app = this;
    app.socketForUserSet = false;
    this.listOfCategories = ["Driving", "Volunteer", "General"];
    app.loadme = false; // Hide main HTML until data is obtained in AngularJS
    if ($window.location.pathname === '/') app.home = true; // Check if user is on home page to show home page div

    // Check if user's session has expired upon opening page for the first time
    if (Auth.isLoggedIn()) {
        // Check if a the token expired
        Auth.getUser().then(function(data) {
            // Check if the returned user is undefined (expired)
            if (data.data.username === undefined) {
                Auth.logout(); // Log the user out
                app.isLoggedIn = false; // Set session to false
                $location.path('/'); // Redirect to home page
                app.loadme = true; // Allow loading of page
            }
        });
    }

    // Function to run an interval that checks if the user's token has expired
    app.checkSession = function() {
        // Only run check if user is logged in
        if (Auth.isLoggedIn()) {
            app.checkingSession = true; // Use variable to keep track if the interval is already running
            // Run interval ever 30000 milliseconds (30 seconds)
            var interval = $interval(function() {
                var token = $window.localStorage.getItem('token'); // Retrieve the user's token from the client local storage
                // Ensure token is not null (will normally not occur if interval and token expiration is setup properly)
                if (token === null) {
                    $interval.cancel(interval); // Cancel interval if token is null
                } else {
                    // Parse JSON Web Token using AngularJS for timestamp conversion
                    self.parseJwt = function(token) {
                        var base64Url = token.split('.')[1];
                        var base64 = base64Url.replace('-', '+').replace('_', '/');
                        return JSON.parse($window.atob(base64));
                    };
                    var expireTime = self.parseJwt(token); // Save parsed token into variable
                    var timeStamp = Math.floor(Date.now() / 1000); // Get current datetime timestamp
                    var timeCheck = expireTime.exp - timeStamp; // Subtract to get remaining time of token
                    // Check if token has less than 30 minutes till expiration
                    if (timeCheck <= 1800) {
                        showModal(1); // Open bootstrap modal and let user decide what to do
                        $interval.cancel(interval); // Stop interval
                    }
                }
            }, 30000);
        }
    };

    app.checkSession(); // Ensure check is ran check, even if user refreshes

    // Function to open bootstrap modal
    var showModal = function(option) {
        app.choiceMade = false; // Clear choiceMade on startup
        app.modalHeader = undefined; // Clear modalHeader on startup
        app.modalBody = undefined; // Clear modalBody on startup
        app.hideButton = false; // Clear hideButton on startup

        // Check which modal option to activate (option 1: session expired or about to expire; option 2: log the user out)
        if (option === 1) {
            app.modalHeader = 'Timeout Warning'; // Set header
            app.modalBody = 'Your session will expired in 30 minutes. Would you like to renew your session?'; // Set body
            $("#myModal").modal({ backdrop: "static" }); // Open modal
            // Give user 10 seconds to make a decision 'yes'/'no'
            $timeout(function() {
                if (!app.choiceMade) app.endSession(); // If no choice is made after 10 seconds, select 'no' for them
            }, 10000);
        } else if (option === 2) {
            app.hideButton = true; // Hide 'yes'/'no' buttons
            app.modalHeader = 'Logging Out'; // Set header
            $("#myModal").modal({ backdrop: "static" }); // Open modal
            // After 1000 milliseconds (2 seconds), hide modal and log user out
            $timeout(function() {
                Auth.logout(); // Logout user
                $location.path('/logout'); // Change route to clear user object
                hideModal(); // Close modal
            }, 2000);
        }
    };

    // Function that allows user to renew their token to stay logged in (activated when user presses 'yes')
    app.renewSession = function() {
        app.choiceMade = true; // Set to true to stop 10-second check in option 1
        // Function to retrieve a new token for the user
        User.renewSession(app.username).then(function(data) {
            // Check if token was obtained
            if (data.data.success) {
                AuthToken.setToken(data.data.token); // Re-set token
                app.checkSession(); // Re-initiate session checking
            } else {
                app.modalBody = data.data.message; // Set error message
            }
        });
        hideModal(); // Close modal
    };

    // Function to expire session and logout (activated when user presses 'no)
    app.endSession = function() {
        app.choiceMade = true; // Set to true to stop 10-second check in option 1
        hideModal(); // Hide modal
        // After 1 second, activate modal option 2 (log out)
        $timeout(function() {
            showModal(2); // logout user
        }, 1000);
    };

    // Function to hide the modal
    var hideModal = function() {
        $("#myModal").modal('hide'); // Hide modal once criteria met
    };

    // Check if user is on the home page
    $rootScope.$on('$routeChangeSuccess', function() {
        if ($window.location.pathname === '/') {
            app.home = true; // Set home page div
        } else {
            app.home = false; // Clear home page div
        }
    });

    // Will run code every time a route changes
    $rootScope.$on('$routeChangeStart', function() {
        if (!app.checkingSession) app.checkSession();
        console.log('route change');

        // Check if user is logged in
        if (Auth.isLoggedIn()) {
            console.log('user logged in');
            // Custom function to retrieve user data
            Auth.getUser().then(function(data) {
                if (data.data.username === undefined) {
                    app.isLoggedIn = false; // Variable to deactivate ng-show on index
                    Auth.logout();
                    app.isLoggedIn = false;
                    $location.path('/');
                } else {
                    console.log('user is known')
                    app.isLoggedIn = true; // Variable to activate ng-show on index
                    app.username = data.data.username; // Get the user name for use in index
                    checkLoginStatus = data.data.username;
                    app.useremail = data.data.email; // Get the user e-mail for us ein index
                    User.getPermission().then(function(data) {
                        if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
                            app.authorized = true; // Set user's current permission to allow management
                            app.loadme = true; // Show main HTML now that data is obtained in AngularJS
                            app.getPosts();
                            console.log('user is admin or moderator');
                        } else {
                            console.log('user is not admin ot moderator');
                            app.authorized = false;
                            app.loadme = true; // Show main HTML now that data is obtained in AngularJS
                            if(!app.socketForUserSet){
                                socket.emit('userLoggedIn',app.username);
                                app.socketForUserSet = true;
                            }
                            app.getPosts();
                            app.getUserInfo();
                        }
                    });
                }
            });
        } else {
            app.isLoggedIn = false; // User is not logged in, set variable to falses
            app.username = ''; // Clear username
            app.loadme = true; // Show main HTML now that data is obtained in AngularJS
        }
        if ($location.hash() == '_=_') $location.hash(null); // Check if facebook hash is added to URL
        app.disabled = false; // Re-enable any forms
        app.errorMsg = false; // Clear any error messages

    });

    // Function to redirect users to facebook authentication page
    this.facebook = function() {
        app.disabled = true;
        $window.location = $window.location.protocol + '//' + $window.location.host + '/auth/facebook';
    };

    // Function to redirect users to twitter authentication page
    this.twitter = function() {
        app.disabled = true;
        $window.location = $window.location.protocol + '//' + $window.location.host + '/auth/twitter';
    };

    // Function to redirect users to google authentication page
    this.google = function() {
        app.disabled = true;
        $window.location = $window.location.protocol + '//' + $window.location.host + '/auth/google';
    };

    // Function that performs login
    this.doLogin = function(loginData) {
        console.log('inside do Login');
        app.loading = true; // Start bootstrap loading icon
        app.errorMsg = false; // Clear errorMsg whenever user attempts a login
        app.expired = false; // Clear expired whenever user attempts a login
        app.disabled = true; // Disable form on submission
        $scope.alert = 'default'; // Set ng class

        // Function that performs login
        Auth.login(app.loginData).then(function(data) {
            // Check if login was successful
            if (data.data.success) {
                console.log('user login successfully');
                app.loading = false; // Stop bootstrap loading icon
                $scope.alert = 'alert alert-success'; // Set ng class
                app.successMsg = data.data.message + '...Redirecting'; // Create Success Message then redirect
                // Redirect to home page after two milliseconds (2 seconds)
                $timeout(function() {
                    $location.path('/'); // Redirect to home
                    app.loginData = ''; // Clear login form
                    app.successMsg = false; // CLear success message
                    app.disabled = false; // Enable form on submission
                    app.checkSession(); // Activate checking of session
                }, 2000);
            } else {
                // Check if the user's account is expired
                if (data.data.expired) {
                    app.expired = true; // If expired, set variable to enable "Resend Link" on login page
                    app.loading = false; // Stop bootstrap loading icon
                    $scope.alert = 'alert alert-danger'; // Set ng class
                    app.errorMsg = data.data.message; // Return error message to login page
                } else {
                    app.loading = false; // Stop bootstrap loading icon
                    app.disabled = false; // Enable form
                    $scope.alert = 'alert alert-danger'; // Set ng class
                    app.errorMsg = data.data.message; // Return error message to login page
                }
            }
        });
    };

    //Rahil Modi : Task post handling
    // Function that post task


    app.getUserInfo = ()=>{
        if (Auth.isLoggedIn()) {
            // Check if a the token expired
            Auth.getUser().then(function(data) {
                // Check if the returned user is undefined (expired)
                if (data.data.username === undefined) {
                    Auth.logout(); // Log the user out
                    app.isLoggedIn = false; // Set session to false
                    $location.path('/'); // Redirect to home page
                    app.loadme = true; // Allow loading of page
                }
                else{
                    console.log('check user Info')
                    console.log(data);
                    let username = data.data.username;
                    Auth.getUserInfo(username).then((data)=>{
                        if(data.data.success){
                            console.log("userInfo received successfully");
                            console.log(data);
                            app.userInfo = data.data.user;
                            app.badges = app.userInfo.badges;
                            app.name = app.userInfo.name;
                            app.mobile = app.userInfo.phoneNumber;
                            app.city = app.userInfo.city;
                            console.log(app.userInfo);
                        }
                        else{
                            console.log('username is not exist')
                            console.log('error in retrieving');
                        }
                    })
                }
            });
        }
    }
    //app.getUserInfo();

    this.postTask = (taskDetails)=>{
        console.log('inside post task method');
        console.log(app.taskDetails);
        app.taskDetails.posted_by = app.username;
        app.taskDetails.posted_at = app.location; //required to be changed
        // app.taskDetails.comment= {
        //     date : Date.now(),
        //     body : "status of the work",
        //     commented_by: app.username
        // }
        console.log(app._city);
        console.log(app.taskDetails.category);
        if(app.taskDetails.day){
            var day = formatDate(app.taskDetails.day);
            app.taskDetails.date = day;  //display the date of the task
        }
        app.taskDetails.posted_at={
            location : app._city,
            latitude : app.lat,
            longitude : app.log
        }
        Jobs.createPost(app.taskDetails).then(function(data){
            if(data.data.success){
                console.log(data.data.message);
                app.taskDetails = {};
                socket.emit('taskOwnerMap',app.username);
                console.log('registering socket');
                app.getPosts();
            }
            else{
                console.log("error while posting");
            }
        })
    }
    function formatDate(date) {
        var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        return [year, month, day].join('-');
    }
    //to get comments
    this.getComments = (taskId)=>{
        console.log(taskId);
        // console.log(app.tasks[index]);
        // console.log(app.tasks[index].taskId);
        // $scope.toshowComment = true;
        // $scope.selectedValue = index;

        //var taskId = app.tasks[index].taskId;
        this.PostObject(taskId);
        $scope.toshowComment = true;
        //$scope.selectedValue = index;
        $scope.selectedValue = taskId;
    }

    this.setClickedUser = (_user)=>{
        app.clickedUsername = _user;
        Auth.getUserInfo(_user).then((data)=>{
            if(data.data.success){
                console.log("userInfo received successfully");
                console.log(data);
                app.clickedUserInfo = data.data.user;
                if(app.clickedUserInfo.badges) app.clickedUserbadges = app.clickedUserInfo.badges;
                app.clickedUserFullname = app.clickedUserInfo.name;
                if(app.clickedUserInfo.phoneNumber) app.clickedUsermobile = app.clickedUserInfo.phoneNumber;
                if(app.clickedUserInfo.city) app.clickedUsercity = app.clickedUserInfo.city;
                app.clickedUseremail = app.clickedUserInfo.email;
                if(app.clikedUserInfo.skills) app.clickedUserSkills = app.clikedUserInfo.skills
                console.log(app.clickedUserInfo);
            }
            else{
                console.log('username is not exist')
                console.log('error in retrieving');
            }
        })
    }

    this.PostObject = (taskId)=>{
        Jobs.getPost(taskId).then((data)=>{
            if(data.data.success){
                console.log("comments received successfully");
                console.log(data);
                app.task = data.data.task;
                console.log(app.task);
            }
            else{
                console.log('error in retrieving');
            }
        });
    }

    //to close the comments
    this.closeComments = (taskId)=>{
        console.log(taskId);
        $scope.toshowComment = false;
    }

    //To change the status of the task
    this.changeStatus = ()=>{
        console.log("check...");
        var updatedData = {};
        if(taskStatus == "available"){
            taskStatus = "Requested";
            updatedData = {
                'taskId' : taskId,
                'status' : taskStatus,
                'requested_by' : app.username
            };
        }else if(taskStatus == "Requested"){
            console.log(taskStatus);
            taskStatus = "Accepted";
            updatedData = {
                'taskId' : taskId,
                'status' : taskStatus
            };
        }else if (taskStatus == "Accepted") {
            taskStatus = "submitted";
            updatedData = {
                'taskId' : taskId,
                'status' : taskStatus
            };
        }else if (taskStatus == "submitted") {
            taskStatus = "completed";
            updatedData = {
                'taskId' : taskId,
                'status' : taskStatus
            };
        }
        Jobs.updateJob(updatedData).then((data)=>{
            console.log(data);
            if(data.data.success){
                console.log('status is updated successfully');
                $('#taskSelection').modal('hide');
                app.getPosts();
                app.getUserInfo();
            }else{
                console.log('error');
                //$('#taskSelection').modal('hide');
            }
        })
    }

    this.revertStatus =()=>{
        console.log("check...");
        let updatedData = {};
        if(taskStatus == "Requested"){
            taskStatus = "available";
            updatedData = {
                'taskId' : taskId,
                'status' : taskStatus,
                'requested_by' : 'none'
            };
        }
        else if(taskStatus == "submitted"){
            console.log(taskStatus);
            taskStatus = "Accepted";
            updatedData = {
                'taskId' : taskId,
                'status' : taskStatus
            };
        }
        else{
            $('#taskSelection').modal('hide');
            return;
        }
        Jobs.updateJob(updatedData).then((data)=>{
            console.log(data);
            if(data.data.success){
                console.log('status is reverted backed successfully');
                $('#taskSelection').modal('hide');
                app.getPosts();
                app.getUserInfo();
            }else{
                console.log('error');
                $('#taskSelection').modal('hide');
            }
        })
    }

    //to store the selected taskId and its status for updating the status
    var taskId,taskStatus;
    this.Params = (taskid,status)=>{
        console.log(taskid);
        taskId = taskid;
        taskStatus = status;
        var volunteer;
        if(status  == 'Requested' || status == 'submitted'){
        app.tasks.forEach((task)=>{
            if(task.taskId == taskid){
                volunteer = task.accepted_by;
                console.log('volunteer ', volunteer);
                }
            })
        }
        if(status == "available"){
            app.modalHeading = 'Would u like to help?';
        }
        if(status == "Requested"){
            app.modalHeading = 'Ready to assigned task to '+ volunteer;
        }
        if(status == "Accepted"){
            app.modalHeading = 'Done with the work?';
            app.disableDeclineButton = true;
        }
        if(status == "submitted"){
            app.modalHeading = 'Happy with the work of the',+ volunteer;
        }
    }

    //to store the comments respective taskId
    var comment_taskId;
    this.params1 = (_taskId)=>{
        console.log('params1')
        console.log(_taskId);
        comment_taskId = _taskId;
    }

    var taskNo,taskSubject,taskBody,taskCat,taskDate;
    this.Params2 = (Id,title,description,category,date)=>{
        console.log('params2');
        console.log(Id+','+title+','+description);
        var d = new Date(date);
        console.log(d);
        $scope.subject = title;
        $scope.body = description;
        $scope.date = d;
        $scope.category = category;
        taskNo = Id;
        taskSubject = title;
        taskBody = description;
        taskCat = category;
        taskDate = date;
        console.log($scope.subject);
        console.log($scope.body);
        console.log($scope.date);
        console.log($scope.category);

    }

    this.updateTask = (subject,body,category,date)=>{
        console.log(subject);
        console.log(body);
        console.log(category);
        console.log(date);


        if(body == undefined || subject == undefined || body == '' || subject == '' || category == '' || category == undefined){
            alert('All fields are mendatory')
        }
        else{
            var day = formatDate(date);

            var updatedData = {
                'taskId' : taskNo,
                'title' : subject,
                'description' : body,
                'dateOfTask' : day,
                'taskCateogry' : category
            }
            Jobs.updateJob(updatedData).then((data)=>{
                console.log(data);
                if(data.data.success){
                    console.log('status is updated successfully');
                    $('#taskUpdation').modal('hide');
                    app.getPosts();
                }else{
                    console.log('error');
                    //$('#taskUpdation').modal('hide');
                }
            })
        }
    }

    //add a comment to the task
    this.postComment = (comment_msg)=>{
        console.log(comment_msg);
            comment = {
                'body' : comment_msg,
                'date' : Date.now(),
                'commented_by' : app.username
            };
            obj = {
                'comments' : comment,
                'taskId' : comment_taskId
            };

        Jobs.addComment(obj).then((data)=>{
            console.log(data);
            if(data.data.success){
                console.log('comment is posted successfully');
                $('#commentPost').modal('hide');
                this.PostObject(obj.taskId);
            }else{
                console.log('error');
            }
        })
    }

    this.getPostsByCategory =(taskCateogry)=>{
        // Runs function to get all the posts from database
        console.log("posts by category")
        Jobs.getPostByCategory(taskCateogry).then(function(data) {
            console.log(data);
            if (data.data.success) {
                app.tasksByCatg = data.data.tasksByCategory;
            } else {
                console.log("error in fetching posts from the server") // Stop loading icon
            }
        });
    }

    this.getPostsByStatus =(status)=>{
        // Runs function to get all the posts from database
        console.log("posts by status")
        Jobs.getPostByCategory(status).then(function(data) {
            console.log(data);
            if (data.data.success) {
                app.tasksByStat = data.data.tasksByStatus;
            } else {
                console.log("error in fetching posts from the server") // Stop loading icon
            }
        });
    }

    this.getPostsByCity =(city)=>{
        // Runs function to get all the posts from database
        console.log("posts by city")
        Jobs.getPostsByCity(city).then(function(data) {
            console.log(data);
            if (data.data.success) {
                app.taskByCity = data.data.tasksByCity;
            } else {
                console.log("error in fetching posts from the server") // Stop loading icon
            }
        });
    }

    app.getPosts =()=>{
        // Runs function to get all the posts from database
        console.log("all posts")
        Jobs.getPosts().then(function(data) {
            console.log(data);
            if (data.data.success) {
                app.tasks = data.data.tasks;
            } else {
                console.log("error in fetching posts from the server") // Stop loading icon
            }
        });
    }

    var options = {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        };

    function error(err) {
          console.warn(`ERROR(${err.code}): ${err.message}`);
    };

    app.getLocation = ()=> {
        console.log('geo location');
        var lat,log;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos){
                console.log('inside pos');
                $scope.lat = pos.coords.latitude;
                $scope.log = pos.coords.longitude;
                console.log($scope.lat +','+$scope.log);
            },error,options);
        } else {
            console.log("Geolocation is not supported by this browser.");
        }

        app.lat = $scope.lat;
        app.log = $scope.log;

        $.getJSON('https://ipinfo.io', function(data){
            console.log("location info object : "+data)
            app._city = data.city;
            var _str = data.loc;
            var loc = _str.split(",");
            console.log(app._city);
            if(app.lat == undefined){
                console.log('latitude is not retrieved by navigator.geolocation')
                app.lat=loc[0];
                console.log(app.lat);
            }
            if(app.log == undefined){
                console.log('longitude is not retrieved by navigator.geolocation')
                app.log=loc[1];
                console.log(app.log)
            }
        })
    }

    socket.on('taskRequestEvent',(data)=>{
        console.log('taskRequestEvent event received');
        console.log(data);
        app.getPosts();
        alert(data + 'has requested for the task');
    })

    socket.on('taskSubmittedEvent',(data)=>{
        console.log('taskSubmittedEvent event received');
        console.log(data);
        app.getPosts();
        alert(data + 'has submitted assigned task');
    })

    socket.on('newTask',(data)=>{
        console.log('new event received');
        console.log(data);
        app.getPosts();
        alert('New feed is available in the dashboard');
    })

    socket.on('taskHasBeenAcceptedByClient',(data)=>{
        console.log('taskHasBeenAcceptedByClient event received');
        console.log(data);
        app.getPosts();
        alert('Start working on the Task');
    })
    socket.on('EarnedBadge',(data)=>{
        console.log('Earned badge event receeived');
        console.log(data);
        app.getPosts();
        app.getUserInfo();
        alert('Congratulations you received a badge for your good work');
    })

    socket.on('rejectedEvent',(data)=>{
        console.log('Sorry rejected event received');
        console.log(data);
        app.getPosts();
        alert('Sorry task provider has disapproved your');
    });

    // Function to logout the user
    app.logout = function() {
        showModal(2); // Activate modal that logs out user
    };

   this.init = ()=>{
      console.log('1');
      app.getLocation(); //to get the users location
      //app.getPosts(); // Invoke function to get posts from databases
      //app.getUserInfo();
      console.log('init')
  };

  //get users by city
  this.getUsersByCity = (city)=>{
      console.log(city);
      User.getUsersByCity(city).then(function(data){
          console.log(data);
          if (data.data.success) {
              app.usersByCity = data.data.users;
          } else {
              console.log("error in fetching posts from the server") // Stop loading icon
          }
      });
    }

    //get Users by skill
  this.getUsersBySkill = (city)=>{
      console.log(city);
      User.getUsersBySkill(city).then(function(data){
          console.log(data);
          if (data.data.success) {
              app.usersBySkill = data.data.users;
          } else {
              console.log("error in fetching posts from the server") // Stop loading icon
          }
      });
    }

app.Imgsrc = ['https://s3-us-west-2.amazonaws.com/facedataset/cmpe273/volunteer1.png' , 'https://s3-us-west-2.amazonaws.com/facedataset/cmpe273/voulanteer3.jpg',' https://s3-us-west-2.amazonaws.com/facedataset/cmpe273/volunteer-2.png'];
this.fbpost = () =>{

 
 //var i = app.badges.length ;
 //if (app.badges.length == )


window.fbAsyncInit = function() {
   FB.init({
     appId      : '207968289713992',
     cookie     : true,
     xfbml      : true,
     version    : 'v2.8'
   });
   //FB.AppEvents.logPageView();
   FB.ui({
   method: 'share',
   display: 'popup',
   message: 'Test share',
   href: app.Imgsrc[app.badges.length-1] 
   
 }, function(response){});
  
 };

 (function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));

}


});
