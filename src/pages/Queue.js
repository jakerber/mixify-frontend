import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { fetchQueue, endQueue, pauseQueue, unpauseQueue, removeSongUpvote, upvoteSong, searchForSong, addSongToQueue, QUEUE_NOT_FOUND_ERROR_MSG, unsubscribeFromQueue, boostQueueSong } from '../services';
import { Group, Avatar, Loader, Text, Input, ScrollArea, Stack, Image, Badge, Indicator, Button, Paper, ActionIcon, Center, PinInput, Modal } from '@mantine/core';
import { IconSearch, IconThumbUp, IconPlayerPauseFilled, IconPlayerStopFilled, IconLock, IconX, IconArrowLeft, IconExplicit, IconCheck, IconRocket } from '@tabler/icons-react';
import { useStripe, useElements, ExpressCheckoutElement } from '@stripe/react-stripe-js';
import spotifyLogo from '../assets/spotify-logo.png';

const useDebounce = (value) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), 1000);
        return () => clearTimeout(handler);
    }, [value]);

    return debouncedValue;
};

export const QueuePage = () => {
    const context = useOutletContext();
    const navigate = useNavigate();
    const stripe = useStripe();
    const elements = useElements();
    const { queueName } = useParams();
    const [queue, setQueue] = useState();
    const [queueLoaded, setQueueLoaded] = useState(false);
    const [queueError, setQueueError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const debouncedSearchQuery = useDebounce(searchQuery);

    const [endButtonLoading, setEndButtonLoading] = useState(false);
    const [pauseButtonLoading, setPauseButtonLoading] = useState(false);
    const [subscribeButtonLoading, setSubscribeButtonLoading] = useState(false);
    const [addingTrackId, setAddingTrackId] = useState('');
    const [upvotingQueueSongId, setUpvotingQueueSongId] = useState('');
    const [searchResultHover, setSearchResultHover] = useState();

    const [boostModalOpen, setBoostModalOpen] = useState(false);
    const [boostingQueueSong, setBoostingQueueSong] = useState();
    const [boostPaymentLoading, setBoostPaymentLoading] = useState(false);
    const [boostUnavailable, setBoostUnavailable] = useState(false);

    const [anotherQueueName, setAnotherQueueName] = useState('');

    let spotifyAuthUrl = `https://accounts.spotify.com/authorize?`;
    spotifyAuthUrl += `client_id=${process.env.REACT_APP_SPOTIFY_CLIENT_ID}`;
    spotifyAuthUrl += `&redirect_uri=${process.env.REACT_APP_SPOTIFY_SUBSCRIBE_REDIRECT_URI}`;
    spotifyAuthUrl += `&response_type=token&show_dialogue=true`;
    spotifyAuthUrl += `&scope=user-modify-playback-state`;

    const fetchAndLoadQueue = async () => {
        try {
            setQueue(await fetchQueue(queueName));
        } catch (error) {
            setQueueError(error.message);
        } finally {
            setQueueLoaded(true);
        }
    };

    const onBoostReady = ({ availablePaymentMethods }) => {
        if (!availablePaymentMethods || !stripe) {
            setBoostUnavailable(true);
        }
        setBoostPaymentLoading(false);
    };

    const onBoostConfirm = async (event) => {
        if (!stripe) {
            notifications.show({
                id: 'boost-failed-no-stripe',
                withCloseButton: true,
                autoClose: 5000,
                title: 'Boost failed 🫠',
                message: 'Stripe is not available.',
                color: 'red'
            });
            setBoostModalOpen(false);
            setBoostUnavailable(true);
            return;
        }

        const { error: submitError } = await elements.submit();
        if (!submitError) {
            notifications.show({
                id: 'boost-failed-on-submit',
                withCloseButton: true,
                autoClose: 5000,
                title: 'Boost failed 🫠',
                message: 'Your payment was rejected.',
                color: 'red'
            });
            setBoostModalOpen(false);
            setBoostUnavailable(true);
            return;
        }

        let stripeClientSecret = '';
        try {
            const newQueue = await boostQueueSong(boostingQueueSong.id, context.visitorId);
            setQueue(newQueue);
            stripeClientSecret = newQueue.stripe_client_secret
        } catch (error) {
            notifications.show({
                id: 'boost-failed-on-backend',
                withCloseButton: true,
                autoClose: 5000,
                title: 'Boost failed 🫠',
                message: 'Try again in a moment.',
                color: 'red'
            });
            await fetchAndLoadQueue();
            setBoostModalOpen(false);
            return;
        }

        const { error } = await stripe.confirmPayment({
            elements,
            clientSecret: stripeClientSecret,
            confirmParams: { return_url: window.location.href }
        });
        if (error) {
            notifications.show({
                id: 'boost-failed-on-confirm',
                withCloseButton: true,
                autoClose: 5000,
                title: 'Boost failed 🫠',
                message: 'Your payment was declined.',
                color: 'red'
            });
            return;
        }

        setBoostModalOpen(false);
    };

    useEffect(() => {
        if (!queueName) {
            navigate('/');
            return;
        }

        fetchAndLoadQueue();
    }, [queueName]);

    useEffect(() => {
        if (!debouncedSearchQuery) {
            setSearchResults([]);
            return;
        }

        (async () => {
            setSearchResults(await searchForSong(queue.id, debouncedSearchQuery));
        })();
    }, [debouncedSearchQuery]);

    window.document.title = 'Mixify – Queue';
    const isQueueOwner = !!queue && queue.started_by_fpjs_visitor_id === context.visitorId;
    const isQueueSubscriber = !!queue && queue.subscribers.find(subscriber => subscriber.fpjs_visitor_id === context.visitorId);
    return queueLoaded ? (
        !!queue ? (
            <>
                <Modal opened={boostModalOpen} onClose={() => setBoostModalOpen(false)} withCloseButton={false} centered>
                    <Stack spacing='xs'>
                        <Text mb={4}>Pay $0.99 to play {boostingQueueSong?.name} by {boostingQueueSong?.artist} next?</Text>
                        <ExpressCheckoutElement
                            onReady={onBoostReady}
                            onConfirm={onBoostConfirm}
                        />
                        {boostPaymentLoading && (
                            <Group position='center' grow noWrap>
                                <Loader mt={-6} size='md' />
                            </Group>
                        )}
                        {boostUnavailable && (
                            <Text fs='italic' c='dimmed' mt={-10}>No payment methods available</Text>
                        )}
                        <div>
                            <Button
                                mt={10}
                                leftIcon={<IconArrowLeft />}
                                radius='xl'
                                size='xs'
                                variant='gradient'
                                onClick={() => {
                                    setBoostModalOpen(false);
                                }}
                            >
                                Back to queue
                            </Button>
                        </div>
                    </Stack>
                </Modal>
                <Stack spacing={3} p={20} pt={15}>
                    <Group spacing={10}>
                        <Indicator
                            processing
                            size={18}
                            position='top-start'
                            offset={4}
                            color='green'
                            withBorder
                            disabled={!!queue.paused_on_utc}
                            mb={10}
                        >
                            <Badge size='xl' p={18}>Queue {`${queue.name}`}</Badge>
                        </Indicator>
                        {!isQueueOwner && (
                            <Button
                                color='dark'
                                radius='xl'
                                size='sm'
                                onClick={() => {
                                    setSubscribeButtonLoading(true);
                                    (async () => {
                                        if (!isQueueSubscriber) {
                                            window.localStorage.setItem('__mixify_sqid', queue.id);
                                            window.location.href = spotifyAuthUrl;
                                        } else {
                                            const updatedQueue = await unsubscribeFromQueue(queue.id, context.visitorId);
                                            setQueue(updatedQueue);
                                        }
                                        setSubscribeButtonLoading(false);
                                    })();
                                }}
                                rightIcon={isQueueSubscriber ? <IconCheck size={18} stroke={2.5} /> : null}
                                sx={{ backgroundColor: 'black' }}
                                styles={{ rightIcon: { marginLeft: 7 } }}
                                loading={subscribeButtonLoading}
                                mb={8}
                            >
                                {isQueueSubscriber ? (
                                    <Group spacing={12}>
                                        {!subscribeButtonLoading && (<Image maw={20} src={spotifyLogo} alt='spotify-logo' withPlaceholder />)}
                                        <Text>Subscribed</Text>
                                    </Group>
                                ) : (
                                    <Group spacing={12}>
                                        {!subscribeButtonLoading && (<Image maw={20} src={spotifyLogo} alt='spotify-logo' withPlaceholder />)}
                                        <Text>Subscribe</Text>
                                    </Group>
                                )}
                            </Button>
                        )}
                    </Group>
                    {isQueueOwner && (
                        <Group mb={10}>
                            <Button
                                size='sm'
                                variant={!!queue.paused_on_utc ? `filled` : `outline`}
                                color='yellow'
                                radius='xl'
                                loading={pauseButtonLoading}
                                onClick={() => {
                                    setPauseButtonLoading(true);
                                    (async () => {
                                        if (!!queue.paused_on_utc) {
                                            const updatedQueue = await unpauseQueue(queue.id);
                                            setQueue(updatedQueue);
                                        } else {
                                            const updatedQueue = await pauseQueue(queue.id);
                                            setQueue(updatedQueue);
                                        }
                                        setPauseButtonLoading(false);
                                    })();
                                }}
                                leftIcon={<IconPlayerPauseFilled size={20} stroke={1} />}
                                styles={{ leftIcon: { marginRight: 5 } }}
                            >
                                {!!queue.paused_on_utc ? `UNPAUSE` : `PAUSE`}
                            </Button>
                            <Button
                                size='sm'
                                variant='outline'
                                color='red'
                                radius='xl'
                                loading={endButtonLoading}
                                onClick={() => {
                                    setEndButtonLoading(true);
                                    (async () => {
                                        await endQueue(queue.id);
                                        navigate('/');
                                        setEndButtonLoading(false);
                                    })();
                                }}
                                leftIcon={<IconPlayerStopFilled size={20} stroke={1} />}
                                styles={{ leftIcon: { marginRight: 5 } }}
                            >
                                END
                            </Button>
                        </Group>
                    )}
                    <Input
                        placeholder='Search music'
                        icon={<IconSearch size={18} stroke={1.5} />}
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        rightSection={(() => {
                            if (!searchQuery) return null;
                            return (
                                <ActionIcon onClick={() => setSearchQuery('')}>
                                    <IconX size={25} stroke={1.5} opacity={0.65} />
                                </ActionIcon>
                            );
                        })()}
                    />
                    {
                        !!searchQuery && (
                            <>
                                {searchResults.length > 0 ? (
                                    <Paper
                                        shadow='xs'
                                        p={0}
                                        mah={300}
                                        sx={{ backgroundColor: '#2b2c3d', overflow: 'hidden' }}
                                        withBorder
                                    >
                                        <ScrollArea h={300}>
                                            <Stack spacing={0}>
                                                {searchResults.map(result => {
                                                    const adding = result.track_id === addingTrackId;
                                                    const alreadyInQueue = queue.queued_songs.find((queuedSong => queuedSong.spotify_track_id === result.track_id));
                                                    return (
                                                        <Group
                                                            key={result.track_id}
                                                            position='apart'
                                                            spacing={2}
                                                            onMouseEnter={() => {
                                                                if (alreadyInQueue) return;
                                                                setSearchResultHover(result.track_id);
                                                            }}
                                                            onMouseLeave={() => setSearchResultHover()}
                                                            onClick={() => {
                                                                if (!!addingTrackId || alreadyInQueue) return;
                                                                setAddingTrackId(result.track_id);
                                                                (async () => {
                                                                    try {
                                                                        const newQueue = await addSongToQueue(queue.id, result.track_id, context.visitorId);
                                                                        setQueue(newQueue);
                                                                    } catch (error) {
                                                                        await fetchAndLoadQueue();
                                                                    }
                                                                    setAddingTrackId('');
                                                                })();
                                                            }}
                                                            sx={{
                                                                backgroundColor: searchResultHover === result.track_id ? '#454657' : 'none',
                                                                padding: '7px 10px',
                                                                cursor: alreadyInQueue ? 'default' : 'pointer'
                                                            }}
                                                            noWrap
                                                        >
                                                            <Group spacing={10} noWrap>
                                                                {adding && <Loader size='xs' />}
                                                                <Avatar src={result.track_album_cover_url} opacity={adding || alreadyInQueue ? 0.5 : 1} />
                                                                <div>
                                                                    <Text size='sm' opacity={adding || alreadyInQueue ? 0.5 : 1}>{result.track_name}</Text>
                                                                    <Group spacing={4} noWrap>
                                                                        {result.track_explicit && (<IconExplicit opacity={adding || alreadyInQueue ? 0.5 : 1} size={13} />)}
                                                                        <Text size='xs' opacity={adding || alreadyInQueue ? 0.3 : 0.65} truncate>
                                                                            {result.track_artist}
                                                                        </Text>
                                                                    </Group>
                                                                </div>
                                                            </Group>
                                                            <div>
                                                                {alreadyInQueue && (<Badge mr={5}>Added</Badge>)}
                                                            </div>
                                                        </Group>
                                                    );
                                                })}
                                            </Stack>
                                        </ScrollArea>
                                    </Paper>
                                ) : (
                                    <Paper
                                        shadow='xs'
                                        p='xs'
                                        sx={{ backgroundColor: '#2b2c3d' }}
                                        withBorder
                                    >
                                        <Text size='sm' opacity={0.5}>No results to show</Text>
                                    </Paper>
                                )}
                            </>
                        )
                    }
                    {queue.currently_playing && (
                        <>
                            <Text size='sm' mt={6} mb={-1}>Now</Text>
                            <Paper
                                shadow='xs'
                                p='xs'
                                sx={{ backgroundColor: '#2b2c3d' }}
                                withBorder
                            >
                                <Group position='apart' noWrap>
                                    <Group noWrap>
                                        <Avatar src={queue.currently_playing.album_cover_url} />

                                        <div>
                                            <Text size='sm'>{queue.currently_playing.name}</Text>
                                            <Text size='xs' opacity={0.65}>
                                                {queue.currently_playing.artist}
                                            </Text>
                                        </div>
                                    </Group>
                                </Group>
                            </Paper>
                        </>
                    )}
                    <Text size='sm' mt={8}>Next up</Text>
                    {
                        queue.queued_songs.length > 0 ? (
                            <>
                                {queue.queued_songs.map((song, index) => {
                                    const songUpvotedByUser = song.upvotes.find(upvotedById => upvotedById === context.visitorId);
                                    return (
                                        <Paper
                                            key={`queue-song-${index}`}
                                            shadow='xs'
                                            p='xs'
                                            sx={{ backgroundColor: '#2b2c3d' }}
                                            withBorder
                                            mb={2}
                                        >
                                            <Group position='apart' noWrap>
                                                <Group noWrap>
                                                    <Avatar src={song.album_cover_url} />

                                                    <div>
                                                        <Text size='sm'>{song.name}</Text>
                                                        <Text size='xs' opacity={0.65}>
                                                            {song.artist}
                                                        </Text>
                                                    </div>
                                                </Group>
                                                <Group noWrap pr={10} spacing={5}>
                                                    {!!song.added_to_spotify_queue_on_utc ? (
                                                        <>
                                                            {!!song.boosted_by_fpjs_visitor_id && (
                                                                <ActionIcon
                                                                    size='lg'
                                                                    color='yellow'
                                                                    variant='light'
                                                                >
                                                                    <IconRocket size={25} stroke={1} />
                                                                </ActionIcon>
                                                            )}
                                                            <ActionIcon
                                                                size='lg'
                                                                color='yellow'
                                                                variant='light'
                                                                mr={-1}
                                                            >
                                                                <IconLock size={25} stroke={1} />
                                                            </ActionIcon>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {!boostUnavailable && !queue.paused_on_utc && !!queue.currently_playing && (
                                                                <ActionIcon
                                                                    size='lg'
                                                                    mr={-5}
                                                                    onClick={() => {
                                                                        setBoostingQueueSong(song);
                                                                        setBoostPaymentLoading(true);
                                                                        setBoostModalOpen(true);
                                                                    }}
                                                                >
                                                                    {boostModalOpen && boostingQueueSong?.id === song.id ? (
                                                                        <Loader size='xs' />
                                                                    ) : (
                                                                        <IconRocket size={25} stroke={1} />
                                                                    )}
                                                                </ActionIcon>
                                                            )}
                                                            {songUpvotedByUser ? (
                                                                <ActionIcon
                                                                    size='lg'
                                                                    color='green'
                                                                    variant='light'
                                                                    onClick={() => {
                                                                        setUpvotingQueueSongId(song.id);
                                                                        (async () => {
                                                                            try {
                                                                                const newQueue = await removeSongUpvote(song.id, context.visitorId);
                                                                                setQueue(newQueue);
                                                                            } catch (error) {
                                                                                await fetchAndLoadQueue();
                                                                            }
                                                                            setUpvotingQueueSongId('');
                                                                        })();
                                                                    }}
                                                                >
                                                                    <>
                                                                        {upvotingQueueSongId === song.id ? (
                                                                            <Loader size='xs' />
                                                                        ) : (
                                                                            <IconThumbUp size={25} stroke={1} />
                                                                        )}
                                                                    </>
                                                                </ActionIcon>
                                                            ) : (
                                                                <ActionIcon
                                                                    size='lg'
                                                                    onClick={() => {
                                                                        (async () => {
                                                                            setUpvotingQueueSongId(song.id);
                                                                            try {
                                                                                const newQueue = await upvoteSong(song.id, context.visitorId);
                                                                                setQueue(newQueue);
                                                                            } catch (error) {
                                                                                await fetchAndLoadQueue();
                                                                            }
                                                                            setUpvotingQueueSongId('');
                                                                        })();
                                                                    }}
                                                                >
                                                                    <>
                                                                        {upvotingQueueSongId === song.id ? (
                                                                            <Loader size='xs' />
                                                                        ) : (
                                                                            <IconThumbUp size={25} stroke={1} />
                                                                        )}
                                                                    </>
                                                                </ActionIcon>
                                                            )}
                                                            <Text miw={10}>{song.upvotes.length}</Text>
                                                        </>
                                                    )}
                                                </Group>
                                            </Group>
                                        </Paper>
                                    );
                                })}
                            </>
                        ) : (
                            <Paper
                                shadow='xs'
                                p='xs'
                                sx={{ backgroundColor: '#2b2c3d' }}
                                withBorder
                            >
                                <Text size='sm' opacity={0.65}>Queue is empty</Text>
                            </Paper>
                        )
                    }
                </Stack>
            </>
        ) : (
            <Paper
                shadow='xs'
                p='sm'
                sx={{ backgroundColor: '#2b2c3d' }}
                withBorder
                m={20}
            >
                <>
                    {!!queueError ? (
                        <>
                            {queueError.includes(QUEUE_NOT_FOUND_ERROR_MSG) ? (
                                <Stack mb={10}>
                                    <Text size='sm'>{`Hmm, we couldn't find this queue. Try entering the name again below.`}</Text>
                                    <Center>
                                        <PinInput
                                            size='md'
                                            value={anotherQueueName}
                                            onChange={(value) => setAnotherQueueName(value.toUpperCase())}
                                            length={6}
                                            onComplete={() => window.location.href = `/queue/${anotherQueueName}`}
                                        />
                                    </Center>
                                </Stack>
                            ) : (
                                <>
                                    <Text size='sm'>{`An error occured. Please try again later.`}</Text>
                                    <Text size='sm'>{queueError}</Text>
                                </>
                            )}
                        </>
                    ) : (
                        <Text size='sm'>An unknown error occured. Please try again later.</Text>
                    )
                    }
                    <Button
                        mt={10}
                        leftIcon={<IconArrowLeft />}
                        radius='xl'
                        size='xs'
                        variant='gradient'
                        onClick={() => {
                            navigate('/');
                        }}
                    >
                        Back to home
                    </Button>
                </>
            </Paper>
        )
    ) : (
        <Paper
            shadow='xs'
            p='sm'
            sx={{ backgroundColor: '#2b2c3d' }}
            withBorder
            m={20}
        >
            <Center>
                <Stack align='center' spacing={10}>
                    <Text size='sm'>Loading queue</Text>
                    <Loader />
                </Stack>
            </Center>
        </Paper>
    );
};