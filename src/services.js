const API_URL_BASE = process.env.REACT_APP_API_URL;

const exec_request = async (url) => {
    return fetch(url)
        .then(response => response.json())
        .catch(error => {
            console.log(error);
            return null;
        });
}

export const fetchQueue = async (code) => {
    return exec_request(`${API_URL_BASE}/v1/queue/${code}`);
};

export const createQueue = async (visitorId, accessToken) => {
    return exec_request(`${API_URL_BASE}/v1/queue/${visitorId}/${accessToken}`);
};

export const queueDrakeForever = async (visitorId, queueId) => {
    return exec_request(`${API_URL_BASE}/v1/queue/${visitorId}/${queueId}/drake/forever`);
};

export const upvoteTrack = async (visitorId, queueTrackId) => {
    return exec_request(`${API_URL_BASE}/v1/queue/upvote/${visitorId}/${queueTrackId}`);
};