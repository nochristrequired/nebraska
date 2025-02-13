import { Box, makeStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import MuiList from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'underscore';
import API from '../../api/API';
import { Application, Channel, Package } from '../../api/apiDataTypes';
import { applicationsStore } from '../../stores/Stores';
import { ARCHES } from '../../utils/helpers';
import Empty from '../Common/EmptyContent';
import Loader from '../Common/Loader';
import ModalButton from '../Common/ModalButton';
import SectionPaper from '../Common/SectionPaper';
import EditDialog from './EditDialog';
import Item from './Item';

const useStyles = makeStyles({
  root: {
    '& > hr:first-child': {
      display: 'none',
    },
  },
});

interface PackageChannelApplication extends Application {
  packages: Package[];
  channels: Channel[];
}

function ChannelList(props: {
  application: PackageChannelApplication;
  onEdit: (channelId: string) => void;
}) {
  const { application, onEdit } = props;
  const classes = useStyles();
  const { t } = useTranslation();

  function getChannelsPerArch() {
    const perArch: {
      [key: number]: any[];
    } = {};

    // If application doesn't have any channel return empty object.
    if (application.channels === null) {
      return perArch;
    }

    application.channels.forEach((channel: Channel) => {
      if (!perArch[channel.arch]) {
        perArch[channel.arch] = [];
      }
      perArch[channel.arch].push(channel);
    });

    return perArch;
  }

  const channelsPerArch = getChannelsPerArch();
  const noChannels = !Object.values(channelsPerArch).find(
    (channels: Channel[]) => !!channels && channels.length > 0
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
            <Item
              key={'channelID_' + channel.id}
              channel={channel}
              packages={application.packages || []}
              showArch={false}
              handleUpdateChannel={onEdit}
            />
          ))}
        </MuiList>
      ))}
    </React.Fragment>
  );
}

function List(props: { appID: string }) {
  const { appID } = props;
  const [application, setApplication] = React.useState(
    applicationsStore.getCachedApplication(appID)
  );
  const [packages, setPackages] = React.useState<null | Package[]>(null);
  const [channelToEdit, setChannelToEdit] = React.useState<null | Channel>(null);
  const { t } = useTranslation();

  React.useEffect(() => {
    applicationsStore.addChangeListener(onStoreChange);

    // In case the application was not yet cached, we fetch it here
    if (application === null) {
      applicationsStore.getApplication(props.appID);
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
      applicationsStore.removeChangeListener(onStoreChange);
    };
  }, [application]);

  function onStoreChange() {
    setApplication(applicationsStore.getCachedApplication(appID));
  }

  function onChannelEditOpen(channelID: string) {
    let channels: Channel[] = [];
    if (application) {
      channels = application.channels ? application.channels : [];
    }

    const channelToUpdate =
      !_.isEmpty(channels) && channelID ? _.findWhere(channels, { id: channelID }) || null : null;

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
        {!application ? (
          <Loader />
        ) : (
          <ChannelList application={application} onEdit={onChannelEditOpen} />
        )}
        {channelToEdit && (
          <EditDialog
            data={{ packages: packages, applicationID: appID, channel: channelToEdit }}
            show={channelToEdit !== null}
            onHide={onChannelEditClose}
          />
        )}
      </SectionPaper>
    </Box>
  );
}

export default List;
