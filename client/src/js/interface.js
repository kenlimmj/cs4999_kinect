var AppInterface = (function() {
    var templateDirectory = '',
        appViewportName = "Application Viewport",
        circleFill = "#444",
        circleRadius = 39.26886,
        textFill = "#444",
        textSize = 18,
        labelAlignment = "right";

    var templatePrototypeGenerator = function(elementId) {
        var link = document.querySelector('link[rel="import"][data-id=' + elementId + ']').import;
        template = link.getElementById(elementId),
        content = template.content;
        contentNode = document.importNode(content, true);

        return Object.create(HTMLElement.prototype, {
            createdCallback: {
                value: function() {
                    this.appendChild(contentNode);
                }
            }
        });
    };

    var registerTemplate = function(tagName, templateId) {
        return document.registerElement(tagName, {
            prototype: templatePrototypeGenerator(templateId)
        });
    };

    var supportsImports = function() {
        return 'import' in document.createElement('link');
    }

    var insertImportLink = function(templateName, asyncState) {
        var asyncState = asyncState || true,
            linkNode = document.createElement('link');

        linkNode.dataset.id = templateName;
        linkNode.setAttribute('rel', 'import');
        linkNode.setAttribute('async', asyncState.toString());
        linkNode.setAttribute('href', templateDirectory + templateName + '.html');
        document.head.appendChild(linkNode);

        return linkNode;
    };

    var requestNotificationPermission = function() {
        window.addEventListener('load', function() {
            Notification.requestPermission(function(status) {
                if (Notification.permission !== status) {
                    Notification.permission = status;
                }
            });
        });
    }

    var notify = function(title, body, tag, duration) {
        var duration = duration || 5000,
            body = body || "",
            tag = tag || "kinectNotification";

        if (window.Notification && Notification.permission === "granted") {
            var message = new Notification(title, {
                body: body,
                tag: tag
            });
        }

        message.onshow = function() {
            setTimeout(function() {
                message.close();
            }, duration);
        }

        return message;
    };

    var AppInterface = function(width, height) {
        var _ = this;

        // Set the width and height of the app to that of the window
        // unless arguments were passed to the constructor
        _.viewport = {
            width: width || window.innerWidth,
            height: height || window.innerHeight
        }

        // Only proceed if the browser supports HTML imports
        if (supportsImports) {
            // Schedule async imports
            var lockScreenLink = insertImportLink('kinectLockScreen'),
                overlayLink = insertImportLink('kinectNavOverlay');

            // Defer all actions until the template import finishes
            lockScreenLink.onload = function() {
                // Insert the lock screen only if it doesn't already exist
                if (document.getElementsByTagName('kinect-lockscreen').length === 0) {
                    // Register the web components in the DOM
                    var overlayTemplate = registerTemplate('kinect-lockscreen', 'kinectLockScreen'),
                        kinectLockScreen = new overlayTemplate();

                    document.body.insertBefore(kinectLockScreen, document.body.firstChild);
                } else {
                    var kinectLockScreen = document.getElementsByTagName('kinect-lockscreen')[0];
                }

                // Set an id on the element so it's easy to retrieve later
                kinectLockScreen.id = 'kinectLockScreen';
            }

            // Defer all actions until the template import finishes
            overlayLink.onload = function() {
                // Insert the control overlay only if it doesn't already exist
                if (document.getElementsByTagName('kinect-nav-overlay').length === 0) {
                    var overlayTemplate = registerTemplate('kinect-nav-overlay', 'kinectNavOverlay'),
                        kinectNavOverlay = new overlayTemplate();

                    document.body.insertBefore(kinectNavOverlay, document.getElementsByTagName('kinect-lockscreen')[0].nextSibling);
                } else {
                    var kinectNavOverlay = document.getElementsByTagName('kinect-nav-overlay')[0];
                }

                // Set an id on the element so it's easy to retrieve later
                kinectNavOverlay.id = 'kinectNavOverlay';

                // Draw a canvas stage in the interface overlay
                _.overlay = new Kinetic.Stage({
                    container: 'overlay',
                    width: _.viewport.width,
                    height: _.viewport.height
                });

                // Update the stage whenever the viewport dimensions are changed
                Object.observe(_.viewport, function(changes) {
                    changes.forEach(function(change) {
                        _.overlay.setWidth(change.object.width);
                        _.overlay.setHeight(change.object.height);
                    });
                });
            }
        }


        // Request permission from the user to show notifications
        // Side effects: Gets and stores the user's response to the request
        requestNotificationPermission();
    };

    AppInterface.prototype = {
        notifyRecognizedUser: function(name) {
            return notify("User Detected", "Welcome back, " + name + ". You have full control.", "userRecognition");
        },
        notifyUnknownUser: function() {
            return notify("Unknown User Detected", "Quetzalcoatl will not unlock unless switched to generic user mode.", "userRecognition");
        },
        notifyConnectionEstablished: function() {
            return notify("Connection Established", "Quetzalcoatl is now receiving data from the Kinect connected to this computer.", "connectionStatus");
        },
        notifyConnectionLost: function() {
            return notify("Connection Lost", "Please check the status of the Kinect connected to this computer.", "connectionStatus")
        },
        setWidth: function(width) {
            this.viewport.width = width;

            return this.overlay;
        },
        setHeight: function(height) {
            this.viewport.height = height;

            return this.overlay;
        },
        getWidth: function() {
            return this.viewport.width;
        },
        getHeight: function() {
            return this.viewport.height;
        },
        drawViewport: function() {
            var appViewportLayer = new Kinetic.FastLayer();
            appViewportLayer.canvas.pixelRatio = window.devicePixelRatio;

            // Draw a circle representing the spine base location in the app's viewport
            var appSpineBase = new Kinetic.Circle({
                x: this.getWidth() / 2,
                y: this.getHeight(),
                radius: circleRadius,
                fill: circleFill
            });

            // Draw a text label on the bottom-right of the bounding box
            var appSpineBaseLabel = new Kinetic.Text({
                x: 0,
                y: this.getHeight() - 70,
                width: this.getWidth() - 20,
                align: labelAlignment,
                text: appViewportName + "\n" + "x: " + this.getWidth() + "\n" + "y: " + this.getHeight(),
                fontSize: textSize,
                fill: textFill
            });

            appViewportLayer.add(appSpineBase, appSpineBaseLabel);

            return appViewportLayer;
        },
        showViewport: function() {
            var appViewport = this.drawViewport();

            this.overlay.add(appViewport);

            return this.overlay;
        },
        hideLockScreen: function() {
            $('#kinectLockScreen').velocity({ opacity: 0 }, { display: "none" });
        },
        showLockScreen: function() {
            $('#kinectLockScreen').velocity({ opacity: 1 }, { display: "block" });
        }
    };

    return AppInterface;
})(AppInterface || {});

var foo = new AppInterface();