import { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { fetchQueue, queueDrakeForever, upvoteTrack, searchTracks, addTrackToQueue } from '../services';

export const QueuePage = () => {
    const context = useOutletContext();
    const { queueId } = useParams();
    const [queue, setQueue] = useState();
    const [queueLoaded, setQueueLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

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
                <form>
                    <input
                        type="text"
                        id="track-search"
                        name="track-search"
                        value={searchQuery}
                        onChange={(event) => {
                            setSearchQuery(event.target.value);
                            setSearchResults([]);
                        }}
                    />
                    &nbsp;
                    <button type="button" onClick={() => {
                        (async () => {
                            const results = await searchTracks(queue.id, searchQuery);
                            setSearchResults(results || []);
                        })();
                    }}>
                        Search
                    </button>
                </form>
                {searchResults.length > 0 && (
                    <>
                        <h4>Search results</h4>
                        <ol>
                            {searchResults.map(result => {
                                return (
                                    <li key={`search-result-${result.track_id}`}>
                                        <img src={result.track_album_cover_url} width={40} />
                                        &nbsp;
                                        {result.track_name} by {result.track_artist}
                                        &nbsp;
                                        <button type="button" onClick={() => {
                                            (async () => {
                                                const newQueue = await addTrackToQueue(queue.id, context.visitorId, result.track_id);
                                                setQueue(newQueue);
                                            })();
                                        }}>
                                            Add
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                    </>
                )}
                <h4>Current queue</h4>
                {queue.tracks.length > 0 ? (
                    <ol>
                        {queue.tracks.map(track => {
                            const trackUpvotesByUser = track.upvotes.find(upvotedById => upvotedById === context.visitorId);
                            return (
                                <li key={`queue-track-${track.id}`}>
                                    <img src={track.track_album_cover_url} width={40} />
                                    &nbsp;
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
                    <p>&nbsp; &nbsp; (empty)</p>
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