import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { Badge, Button, Container, Header, Group, Title, Popover, Stack, Text, rem, Center, Image } from '@mantine/core';
import { IconFingerprint } from '@tabler/icons-react';

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
                    >
                        <Title>Mixify</Title>
                    </Group>
                    <Popover width={200} position='bottom' withArrow shadow="md">
                        <Popover.Target>
                            <Button radius='xl' variant='gradient' size='sm' h={32} leftIcon={<IconFingerprint size={17} stroke={3} />}>
                                {!!visitorId ? visitorId.slice(0, 10) : `Loading...`}
                            </Button>
                        </Popover.Target>
                        <Popover.Dropdown>
                            <Stack spacing={5}>
                                <Text size='sm'>Your activity</Text>
                                <Center>
                                    <Badge size='xs' variant='outline' color='green' mt={2}>Coming Soon</Badge>
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