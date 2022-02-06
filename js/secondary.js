window.addEventListener("NodyBroadcastEvent", nodyEventHandler);

function nodyEventHandler(event)
{
    switch (event.data.type)
    {
        case "shutdown-overlay-enable":
            showShutdownOverlay();
            break;
        case "shutdown-overlay-disable":
            hideShutdownOverlay();
            break;
        default:
            console.warn("Unknown Nody Broadcast Event Received: " + event);
    }
}

function showShutdownOverlay()
{
    document.querySelector("#main-content").style.filter = "grayscale(0.90)";
}

function hideShutdownOverlay()
{
    document.querySelector("#main-content").style.filter = "none";
}