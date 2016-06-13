## Policy Table Update
Periodically changes will be made to a policy table, either by the server or core.  In order to synchronize the two tables a policy table update must be performed.  An update is [triggered by core](https://github.com/smartdevicelink/sdl_core/wiki/Policies) by either an application connecting for the first time or by one of the [policy table update configurations](#moduleConfigPolicyTableUpdateConfigurations) or by a user's request.  When requesting a policy table update, core sends its current policy table, called a policy table snapshot, to the server.  The server records any aggregate usage data as needed or designed, then responds to the request with a policy table update that contains the latest [module config](), [functional groupings](), [application policies](), and [consumer friendly messages]().  The [application policies]() section will only contain information for the current list of applications in the received policy table snapshot.  In addition, the [consumer friendly messages]() will only be included if an update is required, meaning the received policy table snapshot has an older version than the server.

> Note:  You can read more about how SDL core makes a policy request in the [SDL core wiki](https://github.com/smartdevicelink/sdl_core/wiki/Policies).

### Policy Table Update Sequence Diagram
![Policy Table Update Sequence Diagram](https://raw.githubusercontent.com/smartdevicelink/sdl_server/master/docs/sdl_server_policy_request_sequence_diagram.jpg)

### Policy Table Update Sequence Diagram Steps
1. A policy table update is triggered by SDL core and a snapshot of the current policy table is created.  The snapshot includes the entire local policy table with one exception.  Only the version number property of the [consumer friendly messages](#consumerFriendlyMessagesExample) section is included in the snapshot.
2. An OnSystemRequest RPC is created with a request type of proprietary.  The RPC contains a policy table snapshot in binary and a URL from one of the endpoints defined in the [module config](#moduleConfigServerRequests).  In addition HTML request headers can be present to be used when making the request.
3. The RPC's data is, optionally, encrypted using a synchronous key known only to SDL core and SDL server.  The URL and headers are not encrypted since they are required by the mobile library to forward the request to the SDL server.
4. The RPC is then sent to the mobile library.
5. The mobile library will ignore the request body containing the policy table snapshot, because it is marked as proprietary, and will forward the request to the URL included in the OnSystemRequest RPC.  If the request fails to send then the mobile library will attempt to retry using the configuration specified in the [module config](#moduleConfig).
6. When the server receives the policy table update request it will first lookup the module in the server's database using a unique identifier.  If the module is not found an error will be retured in the server's response.
7. If the policy table snapshot is encrypted, then the server will use the symmetric key found in the module's database record, the one we just looked up, to decrypt the policy table snapshot.  If the data cannot be decrypted, then the data is not from a trusted source and an error is returned in the server's response.
8. The aggregate usage data and vehicle data in the received policy table snapshot is recorded to the server's database. Typically [Usage and Error Counts](#usageAndErrors), [Device Data](#deviceData), and [Module Meta](#moduleMeta) contain data to be recored.
9. A policy table update is created based on the received policy table snapshot.  Note that only applications listed in the policy snapshot will be included in the update.  In addition, if the [consumer friendly messages version number](#consumerFriendlyMessagesGeneralInformation) is lower than the version available on the server, then the updated consumer friendly messages will also be included in the policy update.
10. Then the policy table update is, optionally, encrypted using a symmetric key from the module record we previously looked up.
11. Finally the policy table update is returned in the response to the policy update request.
12. The mobile library then forwards the server's response to core using a SystemRequest RPC message.
13. After being received by core the response body, if encrypted, is decrypted using a symmetric key.  If the body cannot be decrypted, then the data is not from a trusted source and an error is returned to the mobile library using a SystemRequestResponse RPC.
14. The policy table update is applied by replacing the following fields in the local policy table with the fields from the policy table update:  [module config](#moduleConfig), [functional groupings](#functionalGroupings), and [application policies](#applicationPolicies).  In addition, if the [consumer friendly messages](#consumerFriendlyMessages) section of the policy table update contains a **messages** subsection, then the entire [consumer friendly messages](#consumerFriendlyMessages) portion of the local policy table will be replaced with the values from the policy table update.
15. If the response is valid and everything updates ok, then success is returned to the mobile library using a SystemRequestResponse RPC.