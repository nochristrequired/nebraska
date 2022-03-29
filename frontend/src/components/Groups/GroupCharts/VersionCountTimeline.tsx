import { Theme } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { useTheme } from '@material-ui/styles';
import React from 'react';
import semver from 'semver';
import { Group } from '../../../api/apiDataTypes';
import { makeLocaleTime } from '../../../i18n/dateTime';
import { groupChartStoreContext } from '../../../stores/Stores';
import { cleanSemverVersion, makeColorsForVersions } from '../../../utils/helpers';
import Loader from '../../Common/Loader';
import SimpleTable from '../../Common/SimpleTable';
import TimelineChart from './TimelineChart';
import { Duration } from './TimelineChart';

export interface VersionCountTimelineProps {
  group: Group | null;
  duration: Duration;
}

export default function VersionCountTimeline(props: VersionCountTimelineProps) {
  const [selectedEntry, setSelectedEntry] = React.useState(-1);
  const { duration } = props;
  const [timelineChartData, setTimelineChartData] = React.useState<{
    data: any[];
    keys: any[];
    colors: any;
  }>({
    data: [],
    keys: [],
    colors: [],
  });
  const [timeline, setTimeline] = React.useState({
    timeline: {},
    // A long time ago, to force the first update...
    lastUpdate: new Date(2000, 1, 1).toUTCString(),
  });

  const theme = useTheme();

  const ChartStoreContext = groupChartStoreContext();
  const groupChartStore = React.useContext(ChartStoreContext);

  function makeChartData(group: Group, groupTimeline: { [key: string]: any }) {
    const data = Object.keys(groupTimeline).map((timestamp, i) => {
      const versions = groupTimeline[timestamp];
      return {
        index: i,
        timestamp: timestamp,
        ...versions,
      };
    });

    const versions = getVersionsFromTimeline(groupTimeline);
    const versionColors: {
      [key: string]: string;
    } = makeColorsForVersions(theme as Theme, versions, group.channel);

    setTimelineChartData({
      data: data,
      keys: versions,
      colors: versionColors,
    });
  }

  function getVersionsFromTimeline(timeline: { [key: string]: any }) {
    if (Object.keys(timeline).length === 0) {
      return [];
    }

    const versions: string[] = [];

    Object.keys(Object.values(timeline)[0]).forEach(version => {
      const cleanedVersion = cleanSemverVersion(version);
      // Discard any invalid versions (empty strings, etc.)
      if (semver.valid(cleanedVersion)) {
        versions.push(cleanedVersion);
      }
    });

    // Sort versions (earliest first)
    versions.sort((version1, version2) => {
      return semver.compare(version1, version2);
    });

    return versions;
  }

  function getInstanceCount(selectedEntry: number) {
    const version_breakdown = [];
    let selectedEntryPoint = selectedEntry;

    // If there is no timeline or no specific time is selected,
    // show the timeline for the last time point.
    if (selectedEntry === -1) {
      selectedEntryPoint = timelineChartData.data.length - 1;
    }

    let total = 0;

    // If we're not using the default group version breakdown,
    // let's populate it from the selected time one.
    if (version_breakdown.length === 0 && selectedEntryPoint > -1) {
      // Create the version breakdown from the timeline
      const entries = timelineChartData.data[selectedEntryPoint] || [];

      for (const version of timelineChartData.keys) {
        const versionCount = entries[version];

        total += versionCount;

        version_breakdown.push({
          version: version,
          instances: versionCount,
          percentage: 0,
        });
      }
    }

    version_breakdown.forEach((entry: { [key: string]: any }) => {
      entry.color = timelineChartData.colors[entry.version];

      // Calculate the percentage if needed.
      if (total > 0) {
        entry.percentage = (entry.instances * 100.0) / total;
      }

      entry.percentage = parseFloat(entry.percentage).toFixed(1);
    });

    // Sort the entries per number of instances (higher first).
    version_breakdown.sort((elem1, elem2) => {
      return -(elem1.instances - elem2.instances);
    });

    return version_breakdown;
  }

  function getSelectedTime() {
    const data = timelineChartData.data;
    if (selectedEntry < 0 || data.length === 0) {
      return '';
    }
    const timestamp = data[selectedEntry] ? data[selectedEntry].timestamp : '';
    return makeLocaleTime(timestamp);
  }

  // Make the timeline data again when needed.
  React.useEffect(() => {
    let canceled = false;
    async function getVersionTimeline(group: Group | null) {
      if (group) {
        // Check if we should update the timeline or it's too early.
        const lastUpdate = new Date(timeline.lastUpdate);
        setTimelineChartData({ data: [], keys: [], colors: [] });
        try {
          const versionCountTimeline = await groupChartStore.getGroupVersionCountTimeline(
            group.application_id,
            group.id,
            duration.queryValue
          );
          if (!canceled) {
            setTimeline({
              timeline: versionCountTimeline,
              lastUpdate: lastUpdate.toUTCString(),
            });
          }
          makeChartData(group, versionCountTimeline || []);
          setSelectedEntry(-1);
        } catch (error) {
          console.error(error);
        }
      }
    }
    getVersionTimeline(props.group);
    return () => {
      canceled = true;
    };
  }, [duration]);

  return (
    <Grid container alignItems="center" spacing={2}>
      <Grid item xs={12}>
        {timelineChartData.data.length > 0 ? (
          <TimelineChart {...timelineChartData} onSelect={setSelectedEntry} />
        ) : (
          <Loader />
        )}
      </Grid>
      <Grid item xs={12} container>
        <Grid item xs={12}>
          <Box width={500}>
            {timelineChartData.data.length > 0 ? (
              selectedEntry !== -1 ? (
                <React.Fragment>
                  <Typography component="span">Showing for:</Typography>
                  &nbsp;
                  <Chip
                    label={getSelectedTime()}
                    onDelete={() => {
                      setSelectedEntry(-1);
                    }}
                  />
                </React.Fragment>
              ) : (
                <Box color="text.secondary" fontSize={14} textAlign="center" lineHeight={1.5}>
                  Showing data for the last time point.
                  <br />
                  Click the chart to choose a different time point.
                </Box>
              )
            ) : null}
          </Box>
        </Grid>
        <Grid item xs={11}>
          {timelineChartData.data.length > 0 && (
            <SimpleTable
              emptyMessage="No data to show for this time point."
              columns={{ version: 'Version', instances: 'Count', percentage: 'Percentage' }}
              instances={getInstanceCount(selectedEntry)}
            />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
}
