import { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { fetchQueue, queueDrakeForever, upvoteTrack } from '../services';

export const QueuePage = () => {
    const context = useOutletContext();
    const { queueId } = useParams();
    const [queue, setQueue] = useState();
    const [queueLoaded, setQueueLoaded] = useState(false);

    useEffect(() => {
        if (!queueId) return;
        (async () => {
            setQueue(await fetchQueue(queueId));
            setQueueLoaded(true);
        })();
    }, [queueId]);

    return queueLoaded ? (
        !!queue ? (
            <div>
                <h1>{!!queue && queue.started_by_visitor_id === context.visitorId ? `Your ` : ''}Queue with ID {`${queueId}`}</h1>
                <button type="button" onClick={() => {
                    (async () => {
                        const newQueue = await queueDrakeForever(context.visitorId, queueId);
                        setQueue(newQueue);
                    })();
                }}>
                    Add Forever by Drake to queue
                </button>
                {queue.tracks.length > 0 ? (
                    <ol>
                        {queue.tracks.map(track => {
                            const trackUpvotesByUser = track.upvotes.find(upvotedById => upvotedById === context.visitorId);
                            return (
                                <li>
                                    {track.track_name} by {track.track_artist}, {track.upvotes.length} upvotes {trackUpvotesByUser && ` (you) `}
                                    {!trackUpvotesByUser && (<button type="button" onClick={() => {
                                        (async () => {
                                            const newQueue = await upvoteTrack(context.visitorId, track.id);
                                            setQueue(newQueue);
                                        })();
                                    }}>
                                        Upvote
                                    </button>)}
                                </li>
                            );
                        })}
                    </ol>
                ) : (
                    <p>Queue is empty</p>
                )}
                <h3>Visitor ID {`${context.visitorId}`}</h3>
            </div>
        ) : (
            <div>
                <h1>Queue not found</h1>
            </div>
        )
    ) : (
        <div>
            <h1>Loading queue...</h1>
        </div>
    );
};