import { Box, makeStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import MuiList from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'underscore';
import API from '../../api/API';
import { Channel, Package } from '../../api/apiDataTypes';
import { applicationsStore } from '../../stores/Stores';
import { ARCHES } from '../../utils/helpers';
import Empty from '../Common/EmptyContent';
import Loader from '../Common/Loader';
import ModalButton from '../Common/ModalButton';
import SectionPaper from '../Common/SectionPaper';
import ChannelEdit from './ChannelEdit';
import ChannelItem from './ChannelItem';

const useStyles = makeStyles({
  root: {
    '& > hr:first-child': {
      display: 'none',
    },
  },
});

function Channels(props: { channels: null | Channel[]; onEdit: (channelId: string) => void }) {
  const { channels, onEdit } = props;
  const classes = useStyles();
  const { t } = useTranslation();

  const channelsPerArch = (function () {
    const perArch: {
      [key: number]: Channel[];
    } = {};

    (channels ? channels : []).forEach((channel: Channel) => {
      if (!perArch[channel.arch]) {
        perArch[channel.arch] = [];
      }
      perArch[channel.arch].push(channel);
    });

    return perArch;
  })();

  const noChannels = !Object.values(channelsPerArch).find(
    channels => !!channels && channels.length > 0
  );

  if (noChannels) {
    return <Empty>{t('channels|No channels created for this application yet')}</Empty>;
  }

  return (
    <React.Fragment>
      {Object.entries(channelsPerArch).map(([arch, channels]) => (
        <MuiList
          key={arch}
          subheader={<ListSubheader disableSticky>{ARCHES[parseInt(arch)]}</ListSubheader>}
          dense
          className={classes.root}
        >
          {channels.map(channel => (
            <ChannelItem
              key={'channelID_' + channel.id}
              channel={channel}
              showArch={false}
              onChannelUpdate={onEdit}
            />
          ))}
        </MuiList>
      ))}
    </React.Fragment>
  );
}

export interface ChannelListProps {
  appID: string;
}
export default function ChannelList(props: ChannelListProps) {
  const { appID } = props;
  const [application, setApplication] = React.useState(
    applicationsStore().getCachedApplication(appID)
  );
  const [packages, setPackages] = React.useState<null | Package[]>(null);

  function onStoreChange() {
    setApplication(applicationsStore().getCachedApplication(appID));
  }

  React.useEffect(() => {
    applicationsStore().addChangeListener(onStoreChange);

    // In case the application was not yet cached, we fetch it here
    if (application === null) {
      applicationsStore().getApplication(props.appID);
    } else {
      // Fetch packages
      API.getPackages(application.id)
        .then(result => {
          if (_.isNull(result.packages)) {
            setPackages([]);
          } else {
            setPackages(result.packages);
          }
        })
        .catch(err => {
          console.error('Error getting the packages for the channel: ', err);
        });
    }

    return function cleanup() {
      applicationsStore().removeChangeListener(onStoreChange);
    };
  }, [application]);

  const channels = application ? (application.channels ? application.channels : []) : [];
  const loading = (application ? application.channels === null : true) || packages === null;

  return (
    <ChannelListPure
      channels={channels}
      appID={appID}
      packages={packages ? packages : []}
      loading={loading}
    />
  );
}

export interface ChannelListPureProps {
  /** Application ID for these channels. */
  appID: string;
  /** The Packages to choose from when adding or editing a channel. */
  packages: Package[];
  /** The channels to list. */
  channels: Channel[];
  /** If we are waiting on channels or packages data. */
  loading: boolean;
}

export function ChannelListPure(props: ChannelListPureProps) {
  const [channelToEdit, setChannelToEdit] = React.useState<null | Channel>(null);
  const { t } = useTranslation();
  const { packages, appID, channels, loading } = props;

  function onChannelEditOpen(channelID: string) {
    const channelToUpdate =
      !_.isEmpty(channels) && channelID
        ? _.findWhere(channels ? channels : [], { id: channelID }) || null
        : null;

    setChannelToEdit(channelToUpdate);
  }

  function onChannelEditClose() {
    setChannelToEdit(null);
  }

  return (
    <Box mt={2}>
      <Box mb={2}>
        <Grid container alignItems="center" justify="space-between">
          <Grid item>
            <Typography variant="h1">{t('channels|Channels')}</Typography>
          </Grid>
          <Grid item>
            <ModalButton
              modalToOpen="AddChannelModal"
              data={{
                packages: packages,
                applicationID: appID,
              }}
            />
          </Grid>
        </Grid>
      </Box>
      <SectionPaper>
        {loading ? <Loader /> : <Channels channels={channels} onEdit={onChannelEditOpen} />}
        {channelToEdit && (
          <ChannelEdit
            data={{ packages: packages, applicationID: appID, channel: channelToEdit }}
            show={channelToEdit !== null}
            onHide={onChannelEditClose}
          />
        )}
      </SectionPaper>
    </Box>
  );
}
