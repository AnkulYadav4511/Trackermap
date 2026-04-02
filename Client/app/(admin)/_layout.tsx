// import React from 'react';
// import { Tabs } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';

// export default function AdminLayout() {
//   return (
//     <Tabs screenOptions={{ 
//       tabBarActiveTintColor: '#007AFF',
//       headerShown: true,
//       tabBarStyle: { height: 60, paddingBottom: 10 }
//     }}>
//       <Tabs.Screen
//         name="admin-dashboard"
//         options={{
//           title: 'Dashboard',
//           tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
//         }}
//       />
      
//       {/* Name must match workers-list.tsx */}
//       <Tabs.Screen
//         name="workers-list"
//         options={{
//           title: 'Workers',
//           tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
//         }}
//       />
      
//       <Tabs.Screen
//         name="settings"
//         options={{
//           title: 'Settings',
//           tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
//         }}
//       />

//       {/* Internal pages (HREF null hides them from the bottom bar) */}
//       <Tabs.Screen
//         name="live-track"
//         options={{
//           href: null,
//           headerTitle: 'Live Tracking'
//         }}
//       />
      
//       {/* Name must match workers-shifts.tsx */}
//       <Tabs.Screen
//         name="workers-shifts"
//         options={{
//           href: null,
//           headerTitle: 'Shift History'
//         }}
//       />

//       {/* Add this inside your <Tabs> component */}
//       <Tabs.Screen
//         name="details"
//         options={{
//           href: null,
//           headerTitle: 'Details'
//         }}
//       />
//     </Tabs>
//   );
// }

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#007AFF',
      headerShown: true,
      tabBarStyle: { height: 60, paddingBottom: 10 }
    }}>
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="workers-list"
        options={{
          title: 'Employees',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />

      <Tabs.Screen name="live-track" options={{ href: null, headerTitle: 'Live Tracking' }} />
      <Tabs.Screen name="workers-shifts" options={{ href: null, headerTitle: 'Shift History' }} />
      <Tabs.Screen name="details" options={{ href: null, headerTitle: 'Details' }} />
    </Tabs>
  );
}