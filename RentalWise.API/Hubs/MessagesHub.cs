using Microsoft.AspNetCore.SignalR;

namespace RentalWise.API.Hubs
{
    public class MessagesHub : Hub
    {
        // We will rely on JWT's NameIdentifier claim so Clients.User(userId) maps

        public async Task SendToUser(string userId, object message)
        {
            await Clients.User(userId).SendAsync("ReceiveMessage", message);
        }
    }
}
