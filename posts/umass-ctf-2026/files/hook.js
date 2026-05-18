Java.perform(function() {
    console.log("[*] Dang tim kiem ClassLoader...");

    var found = false;
    Java.enumerateClassLoaders({
        onMatch: function(loader) {
            try {
                if (loader.findClass("com.example.LegoClicker.SessionValidator")) {
                    console.log("[+] Tim thay ClassLoader: " + loader);
                    Java.classFactory.loader = loader; 
                    found = true;
                    
                    // BYPASS LAZY LOAD
                    // Ép JVM nạp class và bắt buộc chạy khối static {} ngay lập tức
                    var Class = Java.use("java.lang.Class");
                    Class.forName("com.example.LegoClicker.SessionValidator", true, loader);
                    console.log("[+] Da ep chay khoi static, liblegocore.so DA VAO RAM!");
 
                    var targetModule = Process.findModuleByName("liblegocore.so");
                    if (targetModule) {
                        console.log("[+] Da tim thay liblegocore.so tai: " + targetModule.base);
                        
                        // Ép Anti-debug trả về 0
                        var antiDebugTarget = targetModule.base.add(0x21E80);
                        Interceptor.attach(antiDebugTarget, {
                            onLeave: function(retval) {
                                console.log("[!] Phat hien Anti-Debug! Da ep tra ve 0.");
                                retval.replace(ptr(0));
                            }
                        });
                        
                        var SessionValidator = Java.use("com.example.LegoClicker.SessionValidator");
                        console.log("[*] Ép điểm Top 1 và lấy Flag...");
                        
                        var score = int64("1000000000000000"); 
                        var magic_j2 = int64("4521136641424654587"); 
                        
                        var flag = SessionValidator.syncBrickCache(score, magic_j2);
                        console.log("\n==================================");
                        console.log("[!] FLAG: " + flag);
                        console.log("==================================\n");
                    } else {
                        console.log("[-] ERROR");
                    }
                }
            } catch (e) {}
        },
        onComplete: function() {
            if (!found) {
                console.log("[-] Van chua thay class");
            }
        }
    });
});
