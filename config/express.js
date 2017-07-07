/**
 * Module dependencies.
 */
var express = require('express'),
    session = require('express-session'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    compression = require('compression'),
    serveFavicon = require('serve-favicon'),
    serveStatic = require('serve-static'),
    MongoStore = require('connect-mongo')(session),
    flash = require('connect-flash'),
    helpers = require('view-helpers'),
    config = require('./config');

module.exports = function(app, passport, mongoose) {
    app.set('showStackError', true);

    //Prettify HTML
    app.locals.pretty = true;

    //Should be placed before express.static
    app.use(compression({
        filter: function(req, res) {
            return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
        },
        level: 9
    }));

    //Don't use logger for test env
    if (process.env.NODE_ENV !== 'test') {
        app.use(morgan('dev'));
    }

    //Set views path, template engine and default layout
    app.set('views', config.root + '/app/views');
    app.set('view engine', 'jade');

    //Enable jsonp
    app.enable("jsonp callback");

    // Disable X-Powered-By: Express
    app.disable( 'x-powered-by' );

    //cookieParser should be above session
    app.use(cookieParser());

    // request body parsing middleware should be above methodOverride
    app.use(bodyParser());
    app.use(methodOverride());

    //express/mongo session storage
    app.use(session({
        secret: 'MEAN',
        store: new MongoStore({
            mongooseConnection: mongoose.connection,
            collection: 'sessions'
        })
    }));

    //connect flash for flash messages
    app.use(flash());

    //dynamic helpers
    app.use(helpers(config.app.name));

    //use passport session
    app.use(passport.initialize());
    app.use(passport.session());

    //Setting the fav icon and static folder
    //app.use(serveFavicon());
    app.use(serveStatic(config.root + '/public'));

    //Assume "not found" in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
    app.use(function(err, req, res, next) {
        //Treat as 404
        if (~err.message.indexOf('not found')) return next();

        //Log it
        console.error(err.stack);

        //Error page
        res.status(500).render('500', {
            error: err.stack
        });
    });

    // pat: not working currently, always getting a 404 error
    //Assume 404 since no middleware responded
    //app.use(function(req, res, next) {
    //    res.status(404).render('404', {
    //        url: req.originalUrl,
    //        error: 'Not found 1'
    //    });
    //});

};
