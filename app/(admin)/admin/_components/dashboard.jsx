"use client";
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Calendar,
  Car,
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  TrendingUp,
  UserX,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
const Dashboard = ({ initialData }) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!initialData || !initialData.success) {
    return (
      <Alert variant="destructive">
        <Info />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {initialData?.error || "Failed to load dashboard data"}
        </AlertDescription>
      </Alert>
    );
  }

  const { cars, testDrives } = initialData?.data;

  return (
    <div>
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="test-drives">Test Drives</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
  <Card className="text-center hover:shadow-lg transition-shadow duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-semibold text-gray-700">Total Cars</CardTitle>
      <Car className="h-5 w-5 text-gray-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">{cars.total}</div>
      <p className="text-xs text-gray-500">{cars.available} available, {cars.sold} sold</p>
    </CardContent>
  </Card>

  <Card className="text-center hover:shadow-lg transition-shadow duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-semibold text-gray-700">Test Drives</CardTitle>
      <Calendar className="h-5 w-5 text-blue-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">{testDrives.total}</div>
      <p className="text-xs text-gray-500">{testDrives.pending} pending, {testDrives.confirmed} confirmed</p>
    </CardContent>
  </Card>

  <Card className="text-center hover:shadow-lg transition-shadow duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-semibold text-gray-700">Conversion Rate</CardTitle>
      <TrendingUp className="h-5 w-5 text-green-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">{testDrives.conversionRate}%</div>
      <p className="text-xs text-gray-500">From test drives to sales</p>
    </CardContent>
  </Card>

  <Card className="text-center hover:shadow-lg transition-shadow duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-semibold text-gray-700">Cars Sold</CardTitle>
      <DollarSign className="h-5 w-5 text-purple-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">{cars.sold}</div>
      <p className="text-xs text-gray-500">{((cars.sold / cars.total) * 100).toFixed(1)}% of inventory</p>
    </CardContent>
  </Card>

  <Card className="text-center hover:shadow-lg transition-shadow duration-200">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-semibold text-gray-700">No-Show</CardTitle>
      <UserX className="h-5 w-5 text-red-600" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900">{testDrives.noShow}</div>
      <p className="text-xs text-gray-500">{((testDrives.noShow / (testDrives.total || 1)) * 100).toFixed(1)}% of test drives</p>
    </CardContent>
  </Card>
</div>

<Card className="mt-6">
  <CardHeader>
    <CardTitle className="text-lg font-semibold text-gray-800">Dealership Summary</CardTitle>
  </CardHeader>
  <CardContent className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors duration-200">
        <h3 className="font-medium text-sm text-gray-700 mb-2">Car Inventory</h3>
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full"
              style={{ width: `${(cars.available / cars.total) * 100}%` }}
            ></div>
          </div>
          <span className="ml-3 text-sm font-medium text-gray-900">{((cars.available / cars.total) * 100).toFixed(0)}%</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Available inventory capacity</p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors duration-200">
        <h3 className="font-medium text-sm text-gray-700 mb-2">Test Drive Success</h3>
        <div className="flex items-center">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full"
              style={{ width: `${((testDrives.completed / (testDrives.total || 1)) * 100)}%` }}
            ></div>
          </div>
          <span className="ml-3 text-sm font-medium text-gray-900">{((testDrives.completed / (testDrives.total || 1)) * 100).toFixed(0)}%</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">Completed test drives as of 11:15 PM IST, July 25, 2025</p>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-center">
        <span className="text-2xl font-bold text-purple-600">{cars.sold}</span>
        <p className="text-sm text-gray-600 mt-1">Cars Sold</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-center">
        <span className="text-2xl font-bold text-amber-600">{testDrives.pending + testDrives.confirmed}</span>
        <p className="text-sm text-gray-600 mt-1">Upcoming Test Drives</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 text-center">
        <span className="text-2xl font-bold text-green-600">{((cars.available / (cars.total || 1)) * 100).toFixed(0)}%</span>
        <p className="text-sm text-gray-600 mt-1">Inventory Utilization</p>
      </div>
    </div>
  </CardContent>
</Card>
        </TabsContent>
        <TabsContent value="test-drives" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="text-center">
              <CardHeader className="flex flex-col items-center pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Bookings
                </CardTitle>
                <Calendar className="h-4 w-4 text-gray-600 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testDrives.total}</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader className="flex flex-col items-center pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testDrives.pending}</div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (testDrives.pending / (testDrives.total || 1)) *
                    100
                  ).toFixed(0)}
                  % of bookings
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader className="flex flex-col items-center pb-2">
                <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testDrives.confirmed}</div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (testDrives.confirmed / (testDrives.total || 1)) *
                    100
                  ).toFixed(0)}
                  % of bookings
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader className="flex flex-col items-center pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Check className="h-4 w-4 text-blue-600 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testDrives.completed}</div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (testDrives.completed / (testDrives.total || 1)) *
                    100
                  ).toFixed(0)}
                  % of bookings
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader className="flex flex-col items-center pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <XCircle className="h-4 w-4 text-red-600 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testDrives.cancelled}</div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (testDrives.cancelled / (testDrives.total || 1)) *
                    100
                  ).toFixed(0)}
                  % of bookings
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader className="flex flex-col items-center pb-2">
                <CardTitle className="text-sm font-medium">No-Show</CardTitle>
                <UserX className="h-4 w-4 text-gray-600 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testDrives.noShow}</div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (testDrives.noShow / (testDrives.total || 1)) *
                    100
                  ).toFixed(0)}
                  % of bookings
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Drive Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <h3 className="font-medium text-sm mb-2">Conversion Rate</h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {testDrives.conversionRate}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Test drives resulting in car purchases
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <h3 className="font-medium text-sm mb-2">Completion Rate</h3>
                  <div className="text-2xl font-bold text-green-600">
                    {(
                      (testDrives.completed / (testDrives.total || 1)) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Test drives successfully completed
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="font-medium text-sm mb-2">No-Show Rate</h3>
                <div className="text-2xl font-bold text-gray-600">
                  {(
                    (testDrives.noShow / (testDrives.total || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Test drives with no-shows
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-yellow-500 h-4 rounded-full"
                      style={{
                        width: `${
                          (testDrives.pending / (testDrives.total || 1)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    Pending {testDrives.pending} (
                    {(
                      (testDrives.pending / (testDrives.total || 1)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-500 h-4 rounded-full"
                      style={{
                        width: `${
                          (testDrives.confirmed / (testDrives.total || 1)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    Confirmed {testDrives.confirmed} (
                    {(
                      (testDrives.confirmed / (testDrives.total || 1)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full"
                      style={{
                        width: `${
                          (testDrives.completed / (testDrives.total || 1)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    Completed {testDrives.completed} (
                    {(
                      (testDrives.completed / (testDrives.total || 1)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-red-500 h-4 rounded-full"
                      style={{
                        width: `${
                          (testDrives.cancelled / (testDrives.total || 1)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    Cancelled {testDrives.cancelled} (
                    {(
                      (testDrives.cancelled / (testDrives.total || 1)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gray-500 h-4 rounded-full"
                      style={{
                        width: `${
                          (testDrives.noShow / (testDrives.total || 1)) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    No-Show {testDrives.noShow} (
                    {(
                      (testDrives.noShow / (testDrives.total || 1)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
