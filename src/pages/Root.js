import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Badge, Button, Container, Header, Group, Title, Popover, Stack, rem, Center, Image } from '@mantine/core';
import { IconFingerprint } from '@tabler/icons-react';
import mixifyLogoZoom from '../assets/mixify-logo-zoom.png';

export const RootPage = () => {
    const navigate = useNavigate();
    const [visitorId, setVisitorId] = useState('');
    const headerHeight = rem(60);

    useEffect(() => {
        (async () => {
            const fp = await FingerprintJS.load();
            const { visitorId } = await fp.get();
            setVisitorId(visitorId);
        })();
    }, []);

    return (
        <div>
            <Header height={headerHeight} sx={{ borderBottom: 0 }}>
                <Container
                    sx={{
                        height: headerHeight,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                    fluid
                >
                    <Group
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate('/')}
                        spacing={8}
                    >
                        <Image src={mixifyLogoZoom} radius='md' width={45} />
                        <Title order={2}>Mixify</Title>
                    </Group>
                    <Popover width={200} position='bottom-end' withArrow>
                        <Popover.Target>
                            <Button radius='xl' variant='gradient' size='sm' h={32} leftIcon={<IconFingerprint size={17} stroke={3} />}>
                                {!!visitorId ? visitorId.slice(0, 10) : `Loading...`}
                            </Button>
                        </Popover.Target>
                        <Popover.Dropdown>
                            <Stack spacing={5} mb={2}>
                                <Title order={5}>Your activity</Title>
                                <Center h={30}>
                                    <Badge size='xs' variant='outline' color='green' opacity={0.85} mt={2}>Coming Soon</Badge>
                                </Center>
                            </Stack>
                        </Popover.Dropdown>
                    </Popover>
                </Container>
            </Header>
            {!!visitorId && (
                <Outlet context={{ visitorId }} />
            )}
        </div>
    );
};