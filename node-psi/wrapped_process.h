#ifndef NODE_PSI_WRAPPED_PROCESS_H_
#define NODE_PSI_WRAPPED_PROCESS_H_

#include <node.h>
#include <nan.h>
#include "common/win_helpers.h"

namespace sbat {
namespace psi {

class WrappedProcess : public Nan::ObjectWrap {
public:
  static void Init();
  static v8::Local<v8::Value> NewInstance(Process* process);

  static void New(const Nan::FunctionCallbackInfo<v8::Value>& info);
  static void InjectDll(const Nan::FunctionCallbackInfo<v8::Value>& info);
  static void Resume(const Nan::FunctionCallbackInfo<v8::Value>& info);
private:
  WrappedProcess();
  ~WrappedProcess();
  void set_process(Process* process);

  // Disable copying
  WrappedProcess(const WrappedProcess&);
  WrappedProcess& operator=(const WrappedProcess&);

  static Nan::Persistent<v8::Function> constructor;
  
  template <class T>
  static Process* Unwrap(const T &t) {
    WrappedProcess* wrapped_process = Nan::ObjectWrap::Unwrap<WrappedProcess>(t.This());
    return wrapped_process->process_;
  }

  Process* process_;
};

}  // namespace psi
}  // namespace sbat

#endif  // NODE_PSI_WRAPPED_PROCESS_H_