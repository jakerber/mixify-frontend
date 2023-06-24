import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import * as FingerprintJS from '@fingerprintjs/fingerprintjs-pro';

const fpPromise = FingerprintJS.load({ apiKey: 'CrnDfEo7rY3dBvA8W5Bf' });

export const RootPage = () => {
    const [visitorId, setVisitorId] = useState();

    useEffect(() => {
        fpPromise
            .then(fp => fp.get())
            .then((result) => {
                setVisitorId(result.visitorId);
            })
    }, []);

    return (
        <div>
            <h1>Mixify</h1>
            <div>
                <Outlet context={{ visitorId }} />
            </div>
        </div>
    );
};