import {KEY_ESCAPE_STR} from './key-constants.js';

/*
 * Scripting for the shutdown prompt overlay,
 * with options for standby/shutdown/restart.
 */
export class ShutdownPrompt
{
    // Define Events
    static SHUTDOWN_PROMPT_SHOW_EVENT_ID = "shutdown-prompt-show";
    static SHUTDOWN_PROMPT_HIDE_EVENT_ID = "shutdown-prompt-hide";

    /**
     * Whether The Shutdown Prompt Is Active Or Not
     */
    active;

    /**
     * Initializes event listeners for the shutdown prompt.
     */
    constructor()
    {
        // Instance Variable Initialization
        this.active = false;
    
        // Create Greeter Event Handler
        window.addEventListener("GreeterBroadcastEvent", (event) => this.greeterEventHandler(event));
    
        // Add Key Listeners For Shutdown Prompt
        document.addEventListener("keydown", (event) => this.onKeyEvent(event));

        // Skip Button Bindings If Secondary Monitor
        if (window.greeter_comm && !window.greeter_comm.window_metadata.is_primary)
        {
            return;
        }

        // Create Button Listener To Show Shutdown Prompt
        const shutdownOptionsButton = document.getElementById("shutdown-group");
        shutdownOptionsButton.addEventListener("click", () => this.broadcastShowShutdownPromptEvent());
        // Create Cancel Button Listener To Hide Shutdown Prompt
        const cancelButton = document.querySelector("#shutdown-cancel-button");
        cancelButton.addEventListener("click", () => this.broadcastHideShutdownPromptEvent());

        // Create Button Listener To Standby / Sleep
        const standbyButton = document.querySelector("#standby-button");
        standbyButton.addEventListener("click", () =>  this.standby());

        // Create Button Listener To Shutdown
        const shutdownButton = document.querySelector("#shutdown-button");
        shutdownButton.addEventListener("click", () =>  this.shutdown());

        // Create Button Listener To Restart
        const restartButton = document.querySelector("#restart-button");
        restartButton.addEventListener("click", () =>  this.restart());
    }

    /**
     * Button listener to show the shutdown prompt;
     * sends a signal which is received by all windows.
     */
    broadcastShowShutdownPromptEvent()
    {
        // Send Event If Multi-Monitor Supported; Else, Show Directly
        if (window.greeter_comm)
        {
            greeter_comm.broadcast({type: ShutdownPrompt.SHUTDOWN_PROMPT_SHOW_EVENT_ID});
        }
        else
        {
            this.showShutdownPrompt();
        }
    }

    /**
     * Button listener to hide the shutdown prompt;
     * sends a signal which is received by all windows.
     */
    broadcastHideShutdownPromptEvent()
    {
        // Send Event If Multi-Monitor Supported; Else, Show Directly
        if (window.greeter_comm)
        {
            greeter_comm.broadcast({type: ShutdownPrompt.SHUTDOWN_PROMPT_HIDE_EVENT_ID});
        }
        else
        {
            this.hideShutdownPrompt();
        }
    }

    /**
     * Shows the shutdown prompt on this window only.
     */
    showShutdownPrompt()
    {
        // Only Primary Window Has Overlay Content To Show
        if (!window.greeter_comm || window.greeter_comm.window_metadata.is_primary)
        {
            let overlay = document.querySelector("#shutdown-prompt-overlay");
            overlay.classList.add("active");
        }
        document.querySelector("#main-content").classList.add("grayscale");
        this.active = true;
    }

    /**
     * Hides the shutdown prompt on this window only.
     */
    hideShutdownPrompt()
    {
        // Only Primary Window Has Overlay Content To Hide
        if (!window.greeter_comm || window.greeter_comm.window_metadata.is_primary)
        {
            let overlay = document.querySelector("#shutdown-prompt-overlay");
            overlay.classList.remove("active");
        }
        document.querySelector("#main-content").classList.remove("grayscale");
        this.active = false;
    }

    /**
     * Responds to greeter events.
     * 
     * @param {GreeterBroadcastEvent} event The greeter broadcast event. 
     */
    greeterEventHandler(event)
    {
        switch (event.data.type)
        {
            case ShutdownPrompt.SHUTDOWN_PROMPT_SHOW_EVENT_ID:
                this.showShutdownPrompt();
                break;
            case ShutdownPrompt.SHUTDOWN_PROMPT_HIDE_EVENT_ID:
                this.hideShutdownPrompt();
                break;
            default:
                console.warn("Unknown Greeter Broadcast Event Received: " + event);
        }
    }

    /**
     * Standby / sleep button listener, causes system to sleep.
     */
    standby()
    {
        this.broadcastHideShutdownPromptEvent();
        lightdm.suspend();
    }

    /**
     * Shutdown button listener, triggers a system shutdown.
     */
    shutdown()
    {
        lightdm.shutdown();
    }

    /**
     * Restart button listener, triggers a system restart.
     */
    restart()
    {
        lightdm.restart();
    }

    /**
     * Key Listeners For The Shutdown Prompt
     * 
     * @param {KeyboardEvent} event The keydown event.
     */
    onKeyEvent(event)
    {
        if (this.active)
        {
            // Close Shutdown Prompt
            if (event.key === KEY_ESCAPE_STR)
            {
                this.broadcastHideShutdownPromptEvent();
            }
        }
    }
}