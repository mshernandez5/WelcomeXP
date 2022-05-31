/**
 * This script initializes a limited set of components for
 * secondary windows on multi-monitor setups.
 */

import {ShutdownPrompt} from './shutdown-prompt.js';

function init()
{
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
