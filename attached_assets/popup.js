let user = null;
let channelNames = {
  'UCX6OQ3DkcsbYNE6H8uQQuVA': 'MrBeast Main Channel',
  'UC6Bkb7sGltQ8BNgwxw9B2ow': 'Beast Philanthropy',
  'UCRijo3ddMTht_IHyNSNXpNQ': 'TeamTrees'
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');
  chrome.storage.sync.get(['user'], (result) => {
    console.log('Stored user:', result.user);
    if (result.user) {
      user = result.user;
      document.getElementById('login').style.display = 'none';
      document.getElementById('main').style.display = 'block';
      console.log('User already signed in, showing main UI');
      loadViewCounts();
    } else {
      document.getElementById('login').style.display = 'block';
      document.getElementById('main').style.display = 'none';
      console.log('No user, showing login UI');
    }
  });

  document.getElementById('loginBtn').addEventListener('click', () => {
    console.log('Button clicked!');
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error('Auth error:', chrome.runtime.lastError.message);
        return;
      }
      console.log('Token received:', token);
      if (token) {
        fetch('https://www.googleapis.com/oauth2/v3/userinfo?access_token=' + token)
          .then(res => res.json())
          .then(data => {
            console.log('User data:', data);
            user = data.email;
            chrome.storage.sync.set({ user: user }, () => {
              console.log('User saved to storage');
            });
            document.getElementById('login').style.display = 'none';
            document.getElementById('main').style.display = 'block';
            console.log('Main UI should be visible now');
            loadViewCounts();
          })
          .catch(err => console.error('Fetch error:', err));
      }
    });
  });

  document.getElementById('startBtn').addEventListener('click', () => {
    console.log('Start clicked');
    let channelId = document.getElementById('channelSelect').value;
    if (channelId) {
      chrome.runtime.sendMessage({ action: 'start', channelId: channelId });
      alert('Boosting started!');
    } else {
      alert('Pick a channel first!');
    }
  });

  document.getElementById('stopBtn').addEventListener('click', () => {
    console.log('Stop clicked');
    chrome.runtime.sendMessage({ action: 'stop' });
    alert('Boosting stopped!');
  });
});

function loadViewCounts() {
  chrome.storage.sync.get(['viewsByChannel'], (result) => {
    let viewsByChannel = result.viewsByChannel || {};
    let dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = '<h4>Your Impact</h4>';
    for (let channelId in viewsByChannel) {
      let channelName = channelNames[channelId] || 'Unknown Channel';
      let viewCount = viewsByChannel[channelId] || 0;
      let p = document.createElement('p');
      p.textContent = `${channelName}: ${viewCount} views`;
      dashboard.appendChild(p);
    }
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'viewCounted') {
    loadViewCounts();
  } else if (message.action === 'videosFinished') {
    alert('Finished playing all videos for this channel! Please select another channel to continue.');
  }
});