# i want to generate a event log type object structure for all my events related to agriculture system.

## Event Object

### {

    "_id" : "" ,
    Feature_Type : "",
    Module_Action : "",
    Date : "",
    State : "" ,
    Meta_Data: "",
    RelationIds: "",
    RelatedUsers: [{_id: "", email : "", name : "", status: "Read/ActionTaken/ActionPending"}]

### }

## Possible options:

# Features: [Seeding,Irrigation,Disease,Fertilizer,Harvesting,Land_Prep,Weather]

# Modules_Action : [Watering,Pesticide,Fungisite,Weedisite]

# RelationIds: [FieldId,FarmId,LocationId]

# for now eventStream API should be generated with a single collection.

# Implementation highlight:

## API folder, with eventStream model,controller,eventDataLayer and route.

## controller should simply call the eventService from Service Folder.

## eventService will provide eventData from eventDataLayer methods which will include basic CRUD.

## get will take optional arguments for feature/moduleAction or relationIds

## push will not be created or called from controller or API instead it should be internal based on other services to generate events.

## pull API to be generated to handle/update status of events based on user actions.

## events will not be removed so no API/controller etc.


