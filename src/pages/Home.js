import { useState } from "react";
import { useOutletContext, useNavigate } from 'react-router-dom';

export const HomePage = () => {
    const context = useOutletContext();
    const navigate = useNavigate();
    const [queueCode, setQueueCode] = useState('');
    let spotifyAuthUrl = `https://accounts.spotify.com/authorize?`;
    spotifyAuthUrl += `client_id=${process.env.REACT_APP_SPOTIFY_CLIENT_ID}`;
    spotifyAuthUrl += `&redirect_uri=${process.env.REACT_APP_SPOTIFY_REDIRECT_URI}`;
    spotifyAuthUrl += `&response_type=token&show_dialogue=true`;
    spotifyAuthUrl += `&scope=user-modify-playback-state%20`

    return (
        <div>
            <h2>Join a queue</h2>
            <form>
                <input
                    type="text"
                    id="queue-code"
                    name="queue-code"
                    value={queueCode}
                    onChange={(event) => setQueueCode(event.target.value)}
                />
                &nbsp;
                <button type="button" onClick={() => navigate(`/queue/${queueCode}`)}>Join</button>
            </form>
            <br />

            <hr />

            <h2>Start a queue</h2>
            <button type="button" onClick={() => window.location.href = spotifyAuthUrl}>
                Spotify
            </button>
            <br />
            or
            <br />
            <button type="button" disabled={true}>Apple Music</button>
            {context.visitorId && (<h3>Visitor ID {`${context.visitorId}`}</h3>)}
        </div>
    );
};