#ifndef NODE_BW_WRAPPED_BROOD_WAR_H_
#define NODE_BW_WRAPPED_BROOD_WAR_H_

#include <node.h>
#include <map>
#include <memory>
#include <string>

#include "./brood_war.h"
#include "common/types.h"

namespace sbat {
namespace bw {

class EventHandlerContext {
public:
  explicit EventHandlerContext(v8::Handle<v8::Function> callback);
  ~EventHandlerContext();
  v8::Handle<v8::Function> callback() const;
private:
  v8::Persistent<v8::Function> callback_;
};

class WrappedBroodWar : public node::ObjectWrap {
public:
  static void Init();
  static v8::Handle<v8::Value> NewInstance(const v8::Arguments& args);

  typedef std::map<std::string, std::shared_ptr<EventHandlerContext>> EventHandlerMap;
  static std::map<WrappedBroodWar*, EventHandlerMap> event_handlers_;

private:
  WrappedBroodWar();
  ~WrappedBroodWar();

  static v8::Persistent<v8::Function> constructor;
  static v8::Handle<v8::Value> New(const v8::Arguments& args);

  // TODO(tec27): provide accessor for player info somehow

  // accessors
  static v8::Handle<v8::Value> GetCurrentMapPath(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetCurrentMapName(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetCurrentMapFolderPath(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetLocalPlayerId(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetLocalLobbyId(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetLocalPlayerName(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static void SetLocalPlayerName(v8::Local<v8::String> property, v8::Local<v8::Value> value,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetGameSpeed(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetIsBroodWar(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static void SetIsBroodWar(v8::Local<v8::String> property, v8::Local<v8::Value> value,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetIsMultiplayer(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static void SetIsMultiplayer(v8::Local<v8::String> property, v8::Local<v8::Value> value,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetIsHostingGame(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetWasBooted(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetBootReason(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetLobbyDirtyFlag(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static void SetLobbyDirtyFlag(v8::Local<v8::String> property, v8::Local<v8::Value> value,
      const v8::AccessorInfo& info);
  static v8::Handle<v8::Value> GetEventHandler(v8::Local<v8::String> property,
      const v8::AccessorInfo& info);
  static void SetEventHandler(v8::Local<v8::String> property, v8::Local<v8::Value> value,
      const v8::AccessorInfo& info);

  // functions
  static v8::Handle<v8::Value> InitProcess(const v8::Arguments& args);
  static v8::Handle<v8::Value> InitSprites(const v8::Arguments& args);
  static v8::Handle<v8::Value> InitPlayerInfo(const v8::Arguments& args);
  static v8::Handle<v8::Value> ChooseNetworkProvider(const v8::Arguments& args);
  static v8::Handle<v8::Value> CreateGame(const v8::Arguments& args);
  static v8::Handle<v8::Value> SpoofGame(const v8::Arguments& args);
  static v8::Handle<v8::Value> JoinGame(const v8::Arguments& args);
  static v8::Handle<v8::Value> InitGameNetwork(const v8::Arguments& args);
  static v8::Handle<v8::Value> AddComputer(const v8::Arguments& args);
  static v8::Handle<v8::Value> ProcessLobbyTurn(const v8::Arguments& args);
  static v8::Handle<v8::Value> StartGameCountdown(const v8::Arguments& args);
  static v8::Handle<v8::Value> RunGameLoop(const v8::Arguments& args);
  static v8::Handle<v8::Value> LoadPlugin(const v8::Arguments& args);

  // unwrapper helper
  template <class T>
  static BroodWar* Unwrap(const T &t) {
    WrappedBroodWar* wrapped_bw = ObjectWrap::Unwrap<WrappedBroodWar>(t.This());
    return wrapped_bw->brood_war_;
  }

  // Event handlers for BroodWar
  static void OnLobbyDownloadStatus(byte slot, byte download_percent);
  static void OnLobbySlotChange(byte slot, byte storm_id, byte type, byte race, byte team);
  static void OnLobbyStartCountdown();
  static void OnLobbyGameInit(uint32 random_seed, byte player_bytes[8]);
  static void OnLobbyMissionBriefing(byte slot);
  static void OnLobbyChatMessage(byte slot, const std::string& message);

  BroodWar* brood_war_;
};

}  // namespace bw
}  // namespace sbat

#endif  // NODE_BW_WRAPPED_BROOD_WAR_H_