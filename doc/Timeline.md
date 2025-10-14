# Event Timeline Component Specification

## 1. Overview
A responsive React component designed to display a series of events along a timeline. The component renders as a vertical timeline on mobile devices and transforms into a horizontal layout on larger screens (tablets and desktops). It is built to be customizable, easy to integrate, and follows a modern architectural pattern for maintainability.

## 2. Core Features
- **Responsive Design**: Automatically adapts from a vertical to a horizontal layout based on screen width.
- **MVVM Architecture**: Utilizes the Model-View-ViewModel pattern by separating presentational logic (View) from data and state management (ViewModel), promoting cleaner and more testable code.
- **Event Customization**: Allows individual events to be visually categorized using a `color` property, which styles both the event card and its corresponding marker on the timeline.
- **Structured Information Display**: Renders events as distinct cards, each with a header for the date and icon, a body for details, and the event name displayed prominently below.

## 3. Component API (Props)
The primary `Timeline` component accepts the following props:

- `timelineName` (`string`, required): The main title to be displayed above the timeline.
- `events` (`Array`, required): An array of event objects that will be rendered on the timeline.

### Event Object Shape
Each object inside the `events` array must conform to the following structure:

```javascript
{
  // The date of the event (e.g., "2023-10-26").
  date: string,

  // The URL or import path to an icon representing the event.
  icon: string,

  // A detailed description of the event.
  details: string,

  // The name of the event, displayed below the card or timeline marker.
  name: string,

  // (Optional) A valid CSS color string (e.g., "#ff0000", "red") to style the
  // card's top border and the timeline circle's border. If not provided,
  // a default theme color will be used.
  color: string
}
```

## 4. Architectural Guidelines
- **ViewModel (Hook)**: Implemented as a React Hook and located at `client/src/components/ViewModel/useTimelineViewModel.js`.
  - It takes the raw `events` array as input.
  - It processes this array to generate style objects (`cardStyle`, `circleStyle`) based on each event's `color` property.
  - It returns the processed list of events, ready for rendering by the View.
- **View (Presentational Component)**: Implemented as a React component at `client/src/components/View/Timeline.jsx`.
  - This component serves as the main entry point for the feature.
  - It imports and uses the `useTimelineViewModel` hook to process the event data.
  - Its responsibility is to render the final UI based on the props it receives and the data from the ViewModel.

## 5. Visual & Layout Requirements
- **Timeline Bar**: A central line (vertical on mobile, horizontal on desktop) visually connects the events.
- **Event Marker**: Each event is indicated on the timeline by a circle. The border of this circle is colored according to the event's `color` property.
- **Event Card**:
  - **Header**: Contains the event `date` and `icon`.
  - **Body**: Contains the event `details`.
  - **Top Border**: The card features a prominent top border, colored according to the event's `color` property.
- **Event Name**: The `name` of the event is displayed directly below the event card (on mobile) or below the circular marker (on desktop).

## 6. Usage Example
Here is an example of how to use the `Timeline` component in an application:

```jsx
import React from 'react';
import Timeline from './components/timeline/Timeline';
import seedingIcon from './assets/icons/seeding.svg'; // Example icon import
import irrigationIcon from './assets/icons/irrigation.svg';
import harvestIcon from './assets/icons/harvest.svg';

const App = () => {
  const cropCycleEvents = [
    {
      date: '2023-01-15',
      icon: seedingIcon,
      details: 'Planted the new batch of wheat seeds for the spring season.',
      name: 'Seeding',
      color: '#28a745', // Green
    },
    {
      date: '2023-02-20',
      icon: irrigationIcon,
      details: 'Completed the first irrigation cycle for the new crops.',
      name: 'Irrigation',
      color: '#007bff', // Blue
    },
    {
      date: '2023-06-10',
      icon: harvestIcon,
      details: 'Harvested the first batch of wheat. Yield was above average.',
      name: 'Harvesting',
      color: '#ffc107', // Yellow
    },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <Timeline timelineName="2023 Crop Cycle" events={cropCycleEvents} />
    </div>
  );
};

export default App;
```