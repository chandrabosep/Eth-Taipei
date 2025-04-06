// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EventContract {
    struct Event {
        string name;
        string description;
        uint256 startTimestamp;
        uint256 endTimestamp;
        string[] tracks;
        mapping(address => uint256) userEventXP; // Keeping this for backward compatibility
        mapping(address => mapping(address => bool)) userConnections;
    }
    
    // Array to store events
    uint256 private eventCount;
    mapping(uint256 => Event) public events;
    
    // Global XP for users
    mapping(address => uint256) public globalUserXP;
    
    // Global connections between users
    mapping(address => mapping(address => bool)) public globalUserConnections;
    
    // To keep track of all users in the system for leaderboard
    address[] private allUsers;
    mapping(address => bool) private userExists;
    
    // Events for tracking
    event EventCreated(uint256 indexed eventId, string name, uint256 startTime, uint256 endTime);
    event UserConnected(address indexed user1, address indexed user2);
    event XPEarned(address indexed user, uint256 amount, uint256 newGlobalXP);
    
    // Constants
    uint256 private constant CONNECTION_XP_REWARD = 5;
    
    // Function to create a new event
    function createEvent(
        string memory _name,
        string memory _description, 
        uint256 _startTimestamp,
        uint256 _endTimestamp,
        string[] memory _tracks
    ) public returns (uint256) {
        require(_startTimestamp < _endTimestamp, "End time must be after start time");
        
        uint256 eventId = eventCount;
        Event storage newEvent = events[eventId];
        
        newEvent.name = _name;
        newEvent.description = _description; // Fixed bug: was newEvent.name = _description
        newEvent.startTimestamp = _startTimestamp;
        newEvent.endTimestamp = _endTimestamp;
        newEvent.tracks = _tracks;
        
        emit EventCreated(eventId, _name, _startTimestamp, _endTimestamp);
        
        eventCount++;
        return eventId;
    }
    
    // Function to connect with another user (no event ID required)
    function connectWithUser(address _otherUser) public {
        require(_otherUser != msg.sender, "Cannot connect with yourself");
        require(!globalUserConnections[msg.sender][_otherUser], "Already connected with this user");
        
        // Record the connection globally
        globalUserConnections[msg.sender][_otherUser] = true;
        globalUserConnections[_otherUser][msg.sender] = true;
        
        // Track users for the leaderboard
        _trackUser(msg.sender);
        _trackUser(_otherUser);
        
        // Award global XP to both users
        _awardGlobalXP(msg.sender);
        _awardGlobalXP(_otherUser);
        
        emit UserConnected(msg.sender, _otherUser); 
    }
    
    // Legacy function to connect with a user at a specific event
    function connectWithUserAtEvent(uint256 _eventId, address _otherUser) public {
        require(_eventId < eventCount, "Event does not exist");
        require(_otherUser != msg.sender, "Cannot connect with yourself");
        require(block.timestamp >= events[_eventId].startTimestamp, "Event has not started yet");
        require(block.timestamp <= events[_eventId].endTimestamp, "Event has ended");
        require(!events[_eventId].userConnections[msg.sender][_otherUser], "Already connected with this user at this event");
        
        // Record the connection at the event
        events[_eventId].userConnections[msg.sender][_otherUser] = true;
        events[_eventId].userConnections[_otherUser][msg.sender] = true;
        
        // Also record globally if not already connected
        if (!globalUserConnections[msg.sender][_otherUser]) {
            globalUserConnections[msg.sender][_otherUser] = true;
            globalUserConnections[_otherUser][msg.sender] = true;
            
            // Track users for the leaderboard
            _trackUser(msg.sender);
            _trackUser(_otherUser);
            
            // Award global XP to both users
            _awardGlobalXP(msg.sender);
            _awardGlobalXP(_otherUser);
        }
    }
    
    // Internal function to keep track of users for leaderboard
    function _trackUser(address _user) internal {
        if (!userExists[_user]) {
            allUsers.push(_user);
            userExists[_user] = true;
        }
    }
    
    // Internal function to award global XP
    function _awardGlobalXP(address _user) internal {
        // Increase global XP
        globalUserXP[_user] += CONNECTION_XP_REWARD;
        
        emit XPEarned(_user, CONNECTION_XP_REWARD, globalUserXP[_user]);
    }
    
    // Function to get user's XP for a specific event (kept for compatibility)
    function getEventXP(uint256 _eventId, address _user) public view returns (uint256) {
        require(_eventId < eventCount, "Event does not exist");
        return events[_eventId].userEventXP[_user];
    }
    
    // Function to get user's global XP
    function getGlobalXP(address _user) public view returns (uint256) {
        return globalUserXP[_user];
    }
    
    // Function to check if two users are connected globally
    function areUsersConnected(address _user1, address _user2) public view returns (bool) {
        return globalUserConnections[_user1][_user2];
    }
    
    // Function to check if two users are connected at a specific event
    function areUsersConnectedAtEvent(uint256 _eventId, address _user1, address _user2) public view returns (bool) {
        require(_eventId < eventCount, "Event does not exist");
        return events[_eventId].userConnections[_user1][_user2];
    }
    
    // Function to get basic event details
    function getEventDetails(uint256 _eventId) public view returns (
        string memory,
        string memory,
        uint256,
        uint256,
        string[] memory
    ) {
        require(_eventId < eventCount, "Event does not exist");
        Event storage event_ = events[_eventId];
        return (
            event_.name,
            event_.description,
            event_.startTimestamp,
            event_.endTimestamp,
            event_.tracks
        );
    }
    
    // Function to get the total number of events
    function getEventCount() public view returns (uint256) {
        return eventCount;
    }
    
    // Function to get number of users in the system
    function getUserCount() public view returns (uint256) {
        return allUsers.length;
    }
    
    // Global leaderboard that returns all users and their XPs
    function getGlobalLeaderboard() public view returns (address[] memory, uint256[] memory) {
        uint256 count = allUsers.length;
        address[] memory users = new address[](count);
        uint256[] memory xps = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            users[i] = allUsers[i];
            xps[i] = globalUserXP[allUsers[i]];
        }
        
        return (users, xps);
    }
}