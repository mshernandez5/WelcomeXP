/*
 * Windows XP nody-greeter Theme
 * by Markus Hernandez
 * 
 * If you are looking to develop your own web-greeter
 * theme, then check out https://jezerm.github.io/web-greeter/
 * for documentation.
 * 
 * This script initializes all components for the primary window.
 * 
 * On multi-monitor setups, a secondary script will initialize
 * a more limited set of components on other windows.
 */

import {Login} from './login.js';
import {ShutdownPrompt} from './shutdown-prompt.js';

function init()
{
    // Initialize Login / Authentication Script
    let login = new Login();

    // Initialize Shutdown Prompt Script
    let shutdownPrompt = new ShutdownPrompt();
}

/*
 * lightdm is sometimes unavailable at the time
 * this script executes causing crashes.
 * This solves the issue by waiting until
 * the object is initialized.
 */
window.addEventListener("GreeterReady", init);
