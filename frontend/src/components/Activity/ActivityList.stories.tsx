import { Meta, Story } from '@storybook/react/types-6-0';
import { MemoryRouter } from 'react-router-dom';
import ActivityList, { ActivityListProps } from './ActivityList';

export default {
  title: 'activity/ActivityList',
} as Meta;

const Template: Story<ActivityListProps> = args => (
  <MemoryRouter>
    <ActivityList {...args} />
  </MemoryRouter>
);

export const Empty = Template.bind({});
Empty.args = {
  timestamp: 'Wed, 13 May 2020 14:56:03 GMT',
};

export const BetaList = Template.bind({});

BetaList.args = {
  timestamp: 'Wed, 13 May 2020 14:56:03 GMT',
  entries: [
    {
      id: 1,
      app_id: '',
      group_id: '',
      created_ts: '2020-05-13T20:26:03.837688+05:30',
      class: 6,
      severity: 2,
      version: '0.0.0',
      application_name: 'ABC',
      group_name: null,
      channel_name: 'beta',
      instance_id: null,
    },
    {
      id: 2,
      app_id: '',
      group_id: '',
      created_ts: '2020-05-13T20:25:52.589886+05:30',
      class: 6,
      severity: 2,
      version: '0.0.0',
      application_name: 'DEF',
      group_name: null,
      channel_name: 'beta',
      instance_id: null,
    },
  ],
};
