import { useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { createQueue } from '../services';

export const SpotifyAuthPage = () => {
    const context = useOutletContext();
    const navigate = useNavigate();
    const url = window.location.href;
    const spotifyAccessToken = url.split('#')[1].split('&')[0].split('=')[1];

    // TODO: If no context.visitorId in 10 seconds, error out.

    useEffect(() => {
        if (!context.visitorId) return;
        (async () => {
            const queue = await createQueue(context.visitorId, spotifyAccessToken);
            if (!queue || !queue.code) {
                // TODO: Error out.
                navigate('/');
                return;
            }
            navigate(`/queue/${queue.code}`);
        })();
    }, [context.visitorId]);

    return (
        <div>
            <h1>{`${spotifyAccessToken}`}</h1>
        </div>
    );
};