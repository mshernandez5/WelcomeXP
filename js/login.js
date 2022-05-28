import {KEY_TAB_STR} from './key-constants.js';

/**
 * This script deals with user listings and login attempts,
 * containing everything related to authentication.
 */
export class Login
{
    /**
     * The minimum time, in milliseconds, to show the welcome screen
     * after a successful login attempt.
     */
    static welcomeScreenTimeout = 1000;

    /**
     * The default profile picture, if none was found for the user.
     */
    static defaultProfilePicture = "img/bike.png";

    /**
     * The last selected user listing (currently attempting to login).
     */
    activeUserListing;

    /**
     * The username of the last selected user listing.
     * 
     * Can be found through the activeUserListing
     * but is stored separately for convenience.
     */
    activeUserName;

    /**
     * Whether or not there is an authentication attempt in progress,
     * to prevent the user from trying to login before knowing
     * the result of the previous attempt.
     */
    pendingAuthentication;

    /**
     * Initializes event listeners for the login window.
     */
    constructor()
    {
        // Instance Variable Initialization
        this.activeUserListing = null;
        this.activeUserName = null;
        this.pendingAuthentication = false;

        // Connect LightDM Signals To Handlers
        lightdm.show_prompt?.connect((prompt, type) => {
            this.show_prompt(prompt, type);
        });
        lightdm.show_message?.connect((msg, type) => {
            this.show_message(msg, type);
        });
        lightdm.authentication_complete?.connect(() => this.authentication_complete());
        lightdm.autologin_timer_expired?.connect(() => this.autologin_timer_expired());

        // Add Key Listeners For Login Window
        document.addEventListener("keydown", (event) => this.onKeyEvent(event));

        // Add Click Listener To Clear Any Selected User
        document.addEventListener("click", () => this.setActiveUser(null));

        // Add Click Listener To Clear Any Open Popups
        document.addEventListener("click", () => this.removePopup(), true);

        // Populate User Listings
        this.createUserListings();
    }

    /**
     * Called by lightdm to prompt information from the user.
     * 
     * @param {String} text The prompt text.
     * @param {String} type The prompt type, either "text" or "password".
     */
    show_prompt(text, type)
    {
        // Messages Only Useful For Debugging, Disabled For Appearance
        // let header = document.querySelector("#header");
        // header.textContent = type + ": " + text;
    }

    /**
     * Called by lightdm to show a message.
     * 
     * @param {String} text The message text.
     * @param {String} type The message type, either "info" or "error".
     */
    show_message(text, type)
    {
        let header = document.querySelector("#header");
        header.textContent = type + ": " + text;
    }

    /**
     * Called by lightdm after an authentication attempt.
     */
    authentication_complete()
    {
        // Clear Password Field On Login Attempt
        this.activeUserListing.querySelector(".password").value = "";
        this.pendingAuthentication = false;
        if (lightdm.is_authenticated)
        {
            // Display Welcome Screen
            let template = document.getElementById("welcome-template");
            let welcomeBodyContent = template.content.cloneNode(true);
            let mainContent = document.querySelector("#main-content");
            mainContent.innerHTML = "";
            mainContent.appendChild(welcomeBodyContent);
            // After Welcome Screen Timeout, Start Session
            setTimeout(function() {lightdm.start_session(lightdm.default_session)}, Login.welcomeScreenTimeout);
        }
        else
        {
            // Show Error Popup
            this.activeUserListing.querySelector(".password-error-popup").classList.add("active");
            // Enable Password Input Forms
            this.disablePasswordForms(false);
            // Keep User Selected For Another Attempt
            this.pendingAuthentication = true;
            lightdm.authenticate(this.activeUserName);
        }
    }

    /**
     * Clears any password error popup, if any.
     */
    removePopup()
    {
        if (this.activeUserListing)
        {
            // Remove Popup, If Any
            this.activeUserListing.querySelector(".password-error-popup").classList.remove("active");
        }
    }

    /**
     * Called when lightdm attempts to auto-login a user.
     */
    autologin_timer_expired()
    {
        // nothing, don't autologin
    }

    /**
     * Called When A User Listing In The Menu Is Selected
     */
    onUserClick(event)
    {
        this.setActiveUser(event.currentTarget);
        event.stopPropagation();
    }

    /**
     * Set a user listing as the active one.
     * 
     * @param {Element} userListing The selected user listing element
     *                              or null to clear the selection.
     */
    setActiveUser(userListing)
    {
        // Get Name For The Selected User Listing
        let userName;
        if (userListing)
        {
            userName = lightdm.users[userListing.getAttribute("data-user-index")].username;
        }
        else
        {
            userName = null;
        }
        // If Selected User Already Active, Do Nothing
        if (userName === this.activeUserName)
        {
            return;
        }
        // Switching Users, Cancel Previous Authentication
        if (this.activeUserListing && this.pendingAuthentication)
        {
            // Make Previously Selected User Appear Unselected
            this.activeUserListing.classList.remove("active");
            // Clear Previously Selected Password Box
            this.activeUserListing.querySelector(".password").value = "";
            lightdm.cancel_authentication();
        }
        // Update Status To Reflect Selected User
        this.activeUserListing = userListing;
        this.activeUserName = userName;
        // Don't Try To Authenticate New Selection If Clearing Selected User
        if (!userListing)
        {
            return;
        }
        // Assign Styles To Active User Listing
        this.activeUserListing.classList.add("active");
        // Focus Password Box
        this.activeUserListing.querySelector(".password").focus();
        // Begin Authentication
        this.pendingAuthentication = true;
        lightdm.authenticate(this.activeUserName);
    }

    /**
     * Submits the password entry form and attempts to login.
     * 
     * @param {SubmitEvent} event The form submit event.
     */
    onSubmitPassword(event)
    {
        // Prevent Default Form Behavior (Try To Submit To Location)
        event.preventDefault();
        // Disable All Password Input Forms
        this.disablePasswordForms(true);
        // Tell LightDM The Password
        let password = this.activeUserListing.querySelector(".password").value;
        lightdm.respond(password);
    }

    /**
     * Enables or disables the password entry form.
     * 
     * @param {Boolean} isDisabled True if the password entry form should be disabled.
     */
    disablePasswordForms(isDisabled)
    {
        let forms = document.querySelectorAll(".password-form");
        for (let i = 0; i < forms.length; i++)
        {
            let elements = forms[i].elements;
            for (let j = 0; j < elements.length; j++)
            {
                elements[j].disabled = isDisabled;
            }
        }
    }

    /**
     * Populates the user list with entries from lightdm data.
     */
    createUserListings()
    {
        // For Each User, Add A Listing In The HTML Document
        let userListDiv = document.getElementById("userListings");
        for (let i = 0; i < lightdm.users.length; i++)
        {
            let user = lightdm.users[i];
            // Copy HTML Template For New User Listing
            let template = document.querySelector("#user-template");
            let userListing = template.content.cloneNode(true);
            // Populate Template With User-Specific Information
            userListing.querySelector(".user-name").textContent = user.display_name;
            // If Profile Picture Not Found, Use Default
            let userImage = userListing.querySelector(".profile-picture");
            userImage.addEventListener("error", () => {
                console.log("Failed to open profile picture \"" + user.image + "\" for "
                    + user.username + ", using default image instead!");
                userImage.setAttribute("src", Login.defaultProfilePicture);
            });
            userImage.setAttribute("src", user.image);
            // Get Reference To Click Area
            let userClickBox = userListing.querySelector(".user");
            // Get Reference To Login Form
            let loginForm = userListing.querySelector(".password-form");
            // Insert User Listing To Login Page HTML
            userListDiv.appendChild(userListing);
            // Associate Listing With Associated LightDM User Index
            userClickBox.setAttribute("data-user-index", i);
            // Add User Selection Listener
            userClickBox.addEventListener("click", (event) => this.onUserClick(event));
            // Add Login Form Listener
            loginForm.addEventListener("submit", (event) => this.onSubmitPassword(event));
        }
    }

    /**
     * Handels key events affecting user listings.
     * 
     * @param {KeyboardEvent} event The keydown event.
     */
    onKeyEvent(event)
    {
        // Tab Between Users
        if (event.key === KEY_TAB_STR)
        {
            event.preventDefault();
            let next;
            if (!this.activeUserListing || !(next = this.activeUserListing.parentElement.nextElementSibling))
            {
                next = document.querySelector("#userListings div:first-of-type");
            }
            this.setActiveUser(next.firstElementChild);
        }
    }
}
