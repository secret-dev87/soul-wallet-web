import React, { useEffect, useState } from 'react';
import ActivityItem from './comp/ActivityItem';
import { Image, Divider } from '@chakra-ui/react';
import EmptyHint from '@/components/EmptyHint';
import useConfig from '@/hooks/useConfig';
import { useHistoryStore } from '@/store/history';
import HomeCard from '../HomeCard';
import IconLoading from '@/assets/loading.gif';
import { ExternalLink } from '../HomeCard';

export default function Activity() {
  const [loading, setLoading] = useState(false);
  // IMPORTANT TODO: MOVE history list to store
  // const [historyList, setHistoryList] = useState<any>([]);
  const { chainConfig } = useConfig();
  const { historyList } = useHistoryStore();

  return (
    <HomeCard title={'Activity'} external={<ExternalLink title="View all" to="/activity" />} contentHeight="290px">
      {!historyList ||
        (historyList.length === 0 && (
          <>
            {loading ? (
              <Image
                src={IconLoading}
                m="auto"
                w="12"
                h="12"
                pos="absolute"
                top={'0'}
                bottom={'0'}
                left="0"
                right="0"
              />
            ) : (
              <EmptyHint title="No activities" />
            )}
          </>
        ))}
      {historyList.map((item: any, idx: number) => (
        <React.Fragment key={idx}>
          {idx !== 0 && <Divider my="10px" />}
          <ActivityItem key={idx} idx={idx} item={item} scanUrl={chainConfig.scanUrl} />
        </React.Fragment>
      ))}
    </HomeCard>
  );
}
