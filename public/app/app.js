angular.module('userApp', ['appRoutes', 'userControllers', 'userServices', 'ngAnimate', 'mainController', 'authServices', 'emailController', 'taskServices']) //Rahil Modi

.config(function($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptors');
});
